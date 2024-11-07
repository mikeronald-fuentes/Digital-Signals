function encodeNRZL(data) {
    let signal = [1];
    for (let bit of data) {
        signal.push(bit === '1' ? 1 : -1);
    }
    signal.push(parseInt(data[data.length ], 10));
    return signal;
}

function encodeNRZI(data) {
    let signal = [1];
    let current = 1;
    for (let bit of data) {
        if (bit === '1') current *= -1;
        signal.push(current);
    }
    signal.push(current);
    return signal;
}

function encodeBipolarAMI(data) {
    let signal = [1];
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

function encodePseudoternary(data) {
    let signal = [1];
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

function encodeManchester(data) {
    let signal = [1];
    for (let bit of data) {
        signal.push(bit === '0' ? 1 : -1);
        signal.push(bit === '0' ? -1 : 1);
    }
    signal.push(parseInt(data[data.length], 10));
    return signal;
}

function encodeDiffManchester(data) {
    let signal = [1];
    let current = 1;
    for (let bit of data) {
        if (bit === '0') {
            signal.push(-current);
            signal.push(current);
        } else {
            signal.push(current);
            signal.push(-current);
            current *= -1;
        }
    }
    signal.push(current);
    return signal;
}

function isValidBinary(data) {
    const binaryPattern = /^[01]+$/;
    return binaryPattern.test(data);
}

document.querySelectorAll('input[name="encoding"]').forEach((radio) => {
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

    let signal;
    let isManchester = false;
    switch (encoding) {
        case 'NRZ-L': signal = encodeNRZL(data); break;
        case 'NRZ-I': signal = encodeNRZI(data); break;
        case 'Bipolar AMI': signal = encodeBipolarAMI(data); break;
        case 'Pseudoternary': signal = encodePseudoternary(data); break;
        case 'Manchester': 
            signal = encodeManchester(data); 
            isManchester = true; 
            break;
        case 'Differential Manchester': 
            signal = encodeDiffManchester(data); 
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
    const yScale = d3.scaleLinear().domain([-1.5, 1.5]).range([height - 50, 50]);

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
        .tickValues([1, 0, -1])
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
        .attr("y1", yScale(-1.5))
        .attr("y2", yScale(1.5))
        .style("stroke", "#444")
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
}

window.addEventListener('resize', plotEncoding);
