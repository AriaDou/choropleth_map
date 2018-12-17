const EDUCATION_URL = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTIES_URL = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';
const WIDTH = 1000;
const HEIGHT = 800;
const PADDING = 100;
const COLORS = ['white', "#e5f5e0", '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'];
const THRESHOLDS = [3, 12, 21, 30, 39, 48, 57, 66];

async function getData() {
  try {
    const response = await Promise.all([fetch(COUNTIES_URL), fetch(EDUCATION_URL)]);
    if (response[0].ok && response[1].ok) {
      const countiesJson = await response[0].json();
      const educationJson = await response[1].json();

      const chartContainer = d3.select('#chart-container');
      chartContainer.append('h1')
        .attr('id', 'title')
        .text('United States Educational Attainment');
      chartContainer.append('h4')
        .attr('id', 'description')
        .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)");
      const svgContainer = chartContainer.append('div')
        .attr('id', 'svg-container');
      const tooltip = svgContainer.append('div')
        .attr('id', 'tooltip')
        .attr('class', 'bar')
        .style('visibility', 'hidden');
      const svg = svgContainer.append('svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);
      const legend = svg.append('g')
        .attr('transform', 'translate(0, 50)')
        .attr('id', 'legend');

      const threshlodScale = d3.scaleThreshold()
        .domain(THRESHOLDS)
        .range(COLORS);
      const legendScale = d3.scaleLinear()
        .domain([3, 75])
        .range([PADDING, PADDING + 300]);
      const legendAxis = d3.axisBottom(legendScale)
        .tickValues(threshlodScale.domain())
        .tickFormat(d => d + '%')
        .tickSize(16);


      legend.selectAll('rect')
        .data(COLORS.map(color => {
          const d = threshlodScale.invertExtent(color);
          if (d[0] == null) {
            d[0] = legendScale.domain()[0];
          }
          if (d[1] == null) {
            d[1] = legendScale.domain()[1];
          }
          return d;
        }))
        .enter()
        .append('rect')
        .attr('height', 12)
        .attr('width', d => legendScale(d[1]) - legendScale(d[0]))
        .attr('x', d => legendScale(d[0]))
        .attr('fill', d => threshlodScale(d[0]));
        legend.append('g')
          .call(legendAxis)
          .select(".domain")
          .remove();
      svg.selectAll('path')
        .data(topojson.feature(countiesJson, countiesJson["objects"]["counties"]).features)
        .enter()
        .append('path')
        .attr('d', d3.geoPath())
        .attr('class', 'county')
        .attr('data-fips', d => d['id'])
        .attr('data-education', d => educationJson.filter(data => data['fips'] === d['id'])[0].bachelorsOrHigher)
        .attr('fill', d => threshlodScale(educationJson.filter(data => data['fips'] === d['id'])[0].bachelorsOrHigher))
        .attr('transform', 'translate(0, ' + PADDING + ' )')
        .on('mouseover', d => {
          const data = educationJson.filter(data => data['fips'] === d['id'])[0];
          const mouse = d3.mouse(d3.event.currentTarget);
          tooltip.html(`${data.area_name}, ${data.state}: ${data.bachelorsOrHigher}%`)
            .style('top', mouse[1] + 'px')
            .style('left', mouse[0] + 'px')
            .attr('data-education', data.bachelorsOrHigher)
            .style('visibility', 'visible');
        })
        .on('mouseout', () => {
          tooltip.style('visibility', 'hidden');
        });
      svg.append('path')
        .datum(topojson.mesh(countiesJson, countiesJson["objects"]["states"]), (a, b) => a !== b)
        .attr('d', d3.geoPath())
        .attr('stroke', 'white')
        .attr('fill', 'none')
        .attr('transform', 'translate(0, ' + PADDING + ' )');
    } else {
      throw new Error('Request Failed!')
    }
  } catch (error) {
    console.log(error);
  }
}

getData();
