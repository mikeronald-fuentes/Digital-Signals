function encodeNRZL(data, isInitiallyLow) {
    let signal = isInitiallyLow ? [0] : [1];
    for (let bit of data) {
        signal.push(bit === '1' ? 1 : 0);
    }
    signal.push(parseInt(data[data.length], 10));
    return signal;
}

function encodeNRZI(data, isInitiallyLow) {
    let signal = isInitiallyLow ? [0] : [1];
    let current = signal[0];
    for (let bit of data) {
        if (bit === '1') current = 1 - current;
        signal.push(current);
    }
    signal.push(current);
    return signal;
}

function encodeBipolarAMI(data, isInitiallyLow) {
    let signal = isInitiallyLow ? [-1] : [1];
    let polarity = 1;
    for (let bit of data) {
        if (bit === '1') {
            signal.push(polarity);
            polarity *= -1;
        } else {
            signal.push(0);
        }
    }
    signal.push(data[data.length - 1] === '1' ? -polarity : 0);
    return signal;
}

function encodePseudoternary(data, isInitiallyLow) {
    let signal = isInitiallyLow ? [-1] : [1];
    let polarity = 1;
    for (let bit of data) {
        if (bit === '0') {
            signal.push(polarity);
            polarity *= -1;
        } else {
            signal.push(0);
        }
    }
    signal.push(data[data.length - 1] === '0' ? -polarity : 0);
    return signal;
}

function encodeManchester(data, isInitiallyLow) {
    let signal = isInitiallyLow ? [0] : [1];
    for (let bit of data) {
        signal.push(bit === '0' ? 1 : 0);
        signal.push(bit === '0' ? 0 : 1);
    }
    signal.push(parseInt(data[data.length], 10));
    return signal;
}

function encodeDiffManchester(data, isInitiallyLow) {
    let signal = [isInitiallyLow ? 0 : 1]; 
    let current = signal[0];  

    for (let i = 0; i < data.length; i++) {
        let bit = data[i];

        if (i === 0) {  
            if (bit === '0') {
                signal.push(1 - current);
                signal.push(current);
                current = 1 - current; 
            } else {
                signal.push(current);
                signal.push(1 - current); 
            }
        } else {  
            if (bit === '0') {
                signal.push(current);
                signal.push(1 - current);
            } else {
                signal.push(1 - current);
                signal.push(current);
                current = 1 - current;  
            }
        }
    }

    signal.push(current === 0 ? 1 : 0);

    return signal;
}



function isValidBinary(data) {
    const binaryPattern = /^[01]+$/;
    return binaryPattern.test(data);
}

document.querySelectorAll('input[name="encoding"]').forEach((radio) => {
    radio.addEventListener('change', plotEncoding);
});

document.querySelectorAll('input[name="initialState"]').forEach((radio) => {
    radio.addEventListener('change', plotEncoding);
});

document.getElementById('dataEntry').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        plotEncoding();
    }
});

function plotEncoding() {
    const data = document.getElementById('dataEntry').value;
    if (!isValidBinary(data)) {
        document.getElementById('error-message').style.display = 'block';
        return;
    } else {
        document.getElementById('error-message').style.display = 'none';
    }
    const encoding = document.querySelector('input[name="encoding"]:checked').value;
    const initialStart = document.querySelector('input[name="initialState"]:checked').value;

    let signal, yScale, valScale;
    let isInitiallyLow = initialStart === 'low' ? true : false;
    let isManchester = false;
    let hasNigga = false;
    let yTicks = [];

    switch (encoding) {
        case 'NRZ-L': 
            signal = encodeNRZL(data, isInitiallyLow); 
            hasNigga = false;
            break;
        case 'NRZ-I': 
            signal = encodeNRZI(data, isInitiallyLow); 
            hasNigga = false;
            break;
        case 'Bipolar AMI': 
            signal = encodeBipolarAMI(data, isInitiallyLow); 
            hasNigga = true;
            break;
        case 'Pseudoternary': 
            signal = encodePseudoternary(data, isInitiallyLow); 
            hasNigga = true;
            break;
        case 'Manchester': 
            signal = encodeManchester(data, isInitiallyLow);
            hasNigga = false;
            isManchester = true; 
            break;
        case 'Differential Manchester': 
            signal = encodeDiffManchester(data, isInitiallyLow); 
            hasNigga = false;
            isManchester = true;
            break;
        default: return;
    }

    d3.select("#chart").selectAll("*").remove();

    const width = document.getElementById('chart').clientWidth;
    const height = document.getElementById('chart').clientHeight;
    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    const xScale = d3.scaleLinear().domain([0, signal.length]).range([50, width - 50]);
    
    if (hasNigga){
        yScale = d3.scaleLinear().domain([-1.5, 1.5]).range([height - 50, 50]);
        yTicks = [1,0,-1];
        valScale = [-1.5, 1.5];
    }else{
        yScale = d3.scaleLinear().domain([-0.2, 1.2]).range([height - 50, 50]);
        yTicks = [1,0];
        valScale = [-0.2, 1.2];
    }
    
    const lineGenerator = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d))
        .curve(d3.curveStepAfter);

    const path = svg.append("path")
        .datum(signal)
        .attr("fill", "none")
        .attr("stroke", "#4caf50")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator)
        .style("stroke-dasharray", function() {
            const totalLength = this.getTotalLength(); 
            return `${totalLength} ${totalLength}`; 
        })
        .style("stroke-dashoffset", function() {
            return this.getTotalLength(); 
        })
        .transition()
        .duration(1000) 
        .ease(d3.easeCubicInOut) 
        .style("stroke-dashoffset", 0);

    let xTicks;
    if (isManchester) {
        xTicks = d3.range(-1, signal.length - 1, 2); 
    } else {
        xTicks = d3.range(0, signal.length - 1); 
    }

    const xAxis = d3.axisBottom(xScale)
        .tickValues(xTicks)
        .tickFormat((d, i) => (i === 0) ? "" : data[i - 1]);

    const yAxis = d3.axisLeft(yScale)
        .tickValues(yTicks)
        .tickFormat(d => d);

    svg.append("g")
        .attr("transform", `translate(0,${height - 50})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("fill", "#e0e0e0")
        .style("font-size", "18px");

    svg.append("g")
        .attr("transform", `translate(50,0)`)
        .call(yAxis)
        .selectAll("text")
        .style("fill", "#e0e0e0")
        .style("font-size", "18px");

    svg.selectAll(".line")
        .data(signal.slice(1, -1))
        .enter()
        .append("line")
        .attr("x1", (d, i) => xScale(i + 1))
        .attr("x2", (d, i) => xScale(i + 1))
        .attr("y1", yScale(valScale[1]))
        .attr("y2", yScale(valScale[0]))
        .style("stroke", "#444")
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
}

window.addEventListener('resize', plotEncoding);
