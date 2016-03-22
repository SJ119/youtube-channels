var channel = 'JimmyKimmelLive';
var amount = 10;
var sort = 'date';
var thresholds = [25, 50, 75];

function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function requestData(channel, amount) {
    var key = 'AIzaSyAfipZJqJ4ndJZHf_HFjm2E__1kaOMeqBY';

    var requestChannel = 'https://www.googleapis.com/youtube/v3/search?part=id%2Csnippet&maxResults=1&q=' + channel + '&type=channel&key=' + key;
    var result = JSON.parse(httpGet(requestChannel));

    var channelId = result.items[0].id.channelId;
    var requestBrand = 'https://www.googleapis.com/youtube/v3/channels?part=brandingSettings,contentDetails&id=' + channelId + '&key=' + key;
    var channelBrand = JSON.parse(httpGet(requestBrand));

    var uploadId = channelBrand.items[0].contentDetails.relatedPlaylists.uploads;
    var requestUploads = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=' + amount + '&playlistId=' + uploadId + '&key=' + key;
    var uploads = JSON.parse(httpGet(requestUploads));

    var parts = ['snippet', 'statistics'];
    var videoIds = uploads.items.map(function(d) {
        return d.snippet.resourceId.videoId;
    });
    var requestRating = 'https://www.googleapis.com/youtube/v3/videos?part=' + parts + '&id=' + videoIds + '&key=' + key;
    var ratings = JSON.parse(httpGet(requestRating));

    return {
        'ratings': ratings.items,
        'branding': channelBrand.items[0]
    };
};

function changeChannel() {
    var channelValue = $('#channel')[0].value.replace(' ', '');
    if (channelValue != null) {
        channel = channelValue;
        var data = requestData(channel, amount);
        init(data);
    }
};

function changeOptions() {
    var amountValue = $('#amount')[0].value;
    if (amountValue != null) {
        amount = amountValue;
    }
    var sortValue = $('#sort')[0].value;
    if (sortValue != null) {
        sort = sortValue;
    }

    if (amountValue != null || sortValue != null) {
        var data = requestData(channel, amount);
        init(data);
    }
};

function init(data) {

    // Remove all elements from before
    d3.select('.channel-container').selectAll('*').remove();
    d3.select('.video-container').selectAll('*').remove();
    d3.select('.banner-container').selectAll('*').remove();

    var banner = d3.select('.banner-container')
        .append('img')
        .attr({
            'class': 'banner-image',
            'src': data.branding.brandingSettings.image.bannerImageUrl,
            'width': '100%'
        });

    var width = parseInt(d3.select('.banner-container')[0][0].getBoundingClientRect().width);

    d3.select('.content-container')
        .style({
            'margin-left': 'auto',
            'margin-right': 'auto',
            'width': width + 'px'
        });

    var videoWidth = parseInt($('.channel-container').innerWidth()) - (4 * parseInt($('.channel-container').css('padding-left')));
    var videoHeight = parseInt(videoWidth * 9 / 16);

    $('.channel-container')
        .append('<iframe class="selected-video" src="http://www.youtube.com/embed/' + data.ratings[0].id + '"></iframe>');

    $('.selected-video')
        .attr({
            width: videoWidth,
            height: videoHeight
        });

    $('.channel-container')
        .append('<div class="video-information"></div>');
    $('.video-information')
        .append('<span class="video-likes"></span><span class="video-dislikes"></span><span class="video-views"></span>');

    d3.select('.video-likes')
        .text('Likes: ' + data.ratings[0].statistics.likeCount);

    d3.select('.video-dislikes')
        .text('Dislikes: ' + data.ratings[0].statistics.dislikeCount);

    d3.select('.video-views')
        .text('Views: ' + data.ratings[0].statistics.viewCount);

    var svgWidth = parseInt(d3.select('.video-container')[0][0].getBoundingClientRect().width * 0.8);

    var xScale = d3.scale.linear()
        .domain([0, 100]) //Percentage valued domain
        .range([0, svgWidth]); //Width of our bar widget  

    var infoContainer = d3.select('.video-container')
        .append('div')
        .attr({
            'class': 'info-container'
        });

    // Create container for bar-widgets
    var results = infoContainer
        .append('div')
        .attr({
            'class': 'results-info'
        })
        .append('div')
        .attr({
            'class': 'results'
        });

    // Create container for bar widget svg
    results.selectAll('.bar-widgets').data(data.ratings)
        .enter()
        .append('div')
        .on('mouseout', function(d, i) {
            if (!d3.select('.widget-container-' + i).classed('selected')) {
                d3.select('.widget-container-' + i)
                    .classed({
                        'mouseover': false,
                        'selected': false
                    });
            }
        })
        .on('mouseover', function(d, i) {
            if (!d3.select('.widget-container-' + i).classed('selected')) {
                d3.select('.widget-container-' + i)
                    .classed({
                        'mouseover': true,
                        'selected': false
                    });
            }
        })
        .on('click', function(d, i) {
            d3.selectAll('.widget-container')
                .classed({
                    'mouseover': false,
                    'selected': false
                });

            d3.select('.widget-container-' + i)
                .classed({
                        'mouseover': false,
                        'selected': true
                    });

            $('.selected-video')
                .attr('src', 'http://www.youtube.com/embed/' + d.id);
            d3.select('.video-likes')
                .text('Likes: ' + d.statistics.likeCount);
            d3.select('.video-dislikes')
                .text('Dislikes: ' + d.statistics.dislikeCount);
            d3.select('.video-views')
                .text('Views: ' + d.statistics.viewCount);
        })
        .attr({
            'class': function(d, i) {
                return 'widget-container widget-container-' + i;
            }
        })
        .style({
            'opacity': 0
        });

    // Fade elements in
    results.selectAll('.widget-container')
        .transition()
        .duration(function(d, i) {
            return 100 * i + 2000;
        })
        .style({
            'opacity': 1
        });

    // Position widget-numbers in better positions
    results.selectAll('.widget-number')
        .style({
            'left': function(d) {
                return '-' + (this.getBoundingClientRect().width + 5) + 'px';
            }
        });

    results.selectAll('.widget-container')
        .append('div')
        .attr({
            'class': 'bar-widget'
        });


    // Create background line
    results.selectAll('.bar-widget')
        .append('svg')
        .attr({
            'class': 'bar-widget-svg',
            'height': 20,
            'width': svgWidth
        })
        .append('line')
        .attr({
            'class': 'bar-widget-background-line',
            'x1': 0,
            'x2': svgWidth,
            'y1': 15,
            'y2': 15,
            'stroke': '#E7E7E7',
            'stroke-width': 1
        });

    results.selectAll('.bar-widget').select('.bar-widget-svg')
        .append('line')
        .attr({
            'class': 'bar-widget-results',
            'x1': 0,
            'x2': 0,
            'y1': 15,
            'y2': 15,
            'stroke': '#55F400',
            'stroke-width': 8
        })
        .transition()
        .duration(function(d, i) {
            return 100 * i + 2000;
        })
        .attrTween('x2', function(d, i) {
            var likes = parseInt(d.statistics.likeCount);
            var dislikes = parseInt(d.statistics.dislikeCount);
            d.ratingPct = parseInt((likes / (likes + dislikes)) * 100); // Return percentage of likes compared to total likes
            var interpolate = d3.interpolate(0, d.ratingPct);
            var n = i;
            return function(t) {
                var line = d3.select('.threshold-lines-' + n).selectAll('.line')[0];
                for (var i = 0; i < 3; i++) {
                    if (line[i].__data__ < interpolate(t)) {

                        d3.select(line[i]).attr({
                            'stroke': 'grey'
                        });
                    } else {
                        break;
                    }
                }

                return xScale(interpolate(t));
            };
        });

    // Create threshold lines
    results.selectAll('.bar-widget-svg')
        .append('g')
        .attr({
            'class': function(d, i) {
                return 'bar-widget-threshold-lines threshold-lines-' + i;
            }
        })
        .selectAll('.line').data(thresholds)
        .enter()
        .append('line')
        .attr({
            'class': function(d, i) {
                return 'line line-' + i;
            },
            'x1': function(d) {
                return xScale(d);
            },
            'x2': function(d) {
                return xScale(d);
            },
            'y1': 11,
            'y2': 19,
            'stroke': '#FFFFFF',
            'stroke-width': 1
        });

    // Add info to each bar widget
    results.selectAll('.bar-widget')
        .append('div')
        .attr({
            'class': 'info'
        })
        .style({
            'width': svgWidth + 'px',
            'height': 20 + 'px'
        })
        .append('span')
        .attr({
            'class': 'video-title'
        })
        .text(function(d, i) {
            return i + '. ' + d.snippet.title;
        })
        .style({
            'max-width': (svgWidth * 0.85) + 'px',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap'
        });

    results.selectAll('.info')
        .append('span')
        .attr({
            'class': 'video-rating'
        })
        .text(function(d) {
            return '0%';
        })
        .transition()
        .duration(function(d, i) {
            return 100 * i + 2000;
        })
        .tween('text', function(d) {
            var interpolate = d3.interpolate(0, d.ratingPct);
            return function(t) {
                this.textContent = Math.round(interpolate(t)) + '%';
            };
        });
};

var update = function(data) {
    var width = parseInt(d3.select('.banner-container')[0][0].getBoundingClientRect().width);

    d3.select('.content-container')
        .style({
            'margin-left': 'auto',
            'margin-right': 'auto',
            'width': width + 'px'
        });

    var videoWidth = parseInt($('.channel-container').innerWidth()) - (4 * parseInt($('.channel-container').css('padding-left')));
    var videoHeight = parseInt(videoWidth * 9 / 16);

    $('.selected-video')
        .attr({
            width: videoWidth,
            height: videoHeight
        });

    var svgWidth = parseInt(d3.select('.video-container')[0][0].getBoundingClientRect().width * 0.8);

    var xScale = d3.scale.linear()
        .domain([0, 100]) //Percentage valued domain
        .range([0, svgWidth]); //Width of our bar widget  

    d3.selectAll('.bar-widget-svg')
        .attr({
            'width': svgWidth
        })

    d3.selectAll('.bar-widget-background-line')
        .attr({
            'x2': svgWidth
        });


    d3.selectAll('.info')
        .style({
            'width': svgWidth + 'px'
        });

    d3.selectAll('.video-title')
        .style({
            'max-width': (svgWidth * 0.85) + 'px'
        });

    d3.selectAll('.bar-widget').select('.bar-widget-svg').select('.bar-widget-results')
        .attr({
            'x2': function(d) {
                return xScale(d.ratingPct);
            }
        });

    d3.selectAll('.bar-widget-svg').selectAll('.line')
        .attr({
            'x1': function(d) {
                return xScale(d);
            },
            'x2': function(d) {
                return xScale(d);
            }
        });
};

$(document).ready(function() {
    var data = requestData(channel, amount);
    init(data);
    $(window).resize(function() {
        update(data);
    });
});