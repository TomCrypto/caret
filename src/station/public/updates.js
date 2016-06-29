$(document).ready(function() {


    var formatMessage = function(data) {
        var keys = [];
        var vals = [];

        $.each(data, function(k, v) {
            if (($.type(v) === 'object') || (v && Array === v.constructor)) {
                keys.push('[' + k + ']');
                vals.push('');

                var result = formatMessage(v);

                $.each(result.keys, function(_, rk) {
                    keys.push('    ' + rk);
                });

                vals = vals.concat(result.vals);
            } else {
                keys.push(k);
                vals.push(v);
            }
        });

        return {
            keys: keys,
            vals: vals
        };
    };



    var startDate = new Date();
    var offset = 0; // for pagination
    var count = 1000; // as many as possible

    setInterval(function() {
        $.ajax({
            url: "/messages",
            data: {
                since: startDate,
                offset: offset,
                count: count
            },
            dataType: "json",
            contentType: "application/json",
            success: function(data) {
                var atBottom = ($(window).scrollTop() + $(window).height() == $(document).height());

                $.each(data, function(_, msg) {
                    var img;

                    if (msg.origin == 'WiFi') {
                        img = "icons/wifi.png";
                    } else if (msg.origin == 'Satellite') {
                        img = "icons/satellite.png";
                    } else if (msg.origin == 'GPRS') {
                        img = "icons/gprs.png";
                    } else if (msg.origin == 'Radio') {
                        img = "icons/radio.png";
                    }

                    var fmt = formatMessage(msg.message);

                    var keys = fmt.keys.join('\n');
                    var vals = fmt.vals.join('\n');

                    var newRow = $(`<tr class="clickableRow centeredCell"><td><img src="${img}" style="vertical-align:middle"/></td><td class="message">${new Date(msg.received).toLocaleString()}</td><td>${msg.type}</td><td>${msg.channel}</td></tr>`);
                    var newExpandableRow = $(`<tr style="display:none"><td colspan=4><table style="width:100%"><tr><td class="message" style="width:35%"><pre>${keys}</pre></td><td class="message" style="width:65%; text-align:right"><pre>${vals}</pre></td></tr></table></td></tr>`);

                    newRow.click(function() {
                        newExpandableRow.toggle(200);
                    })

                    var elem = $('#messageTable').append(newRow);
                    $('#messageTable').append(newExpandableRow);
                });

                offset += data.length;

                if (atBottom) {
                    $('html, body').scrollTop( $(document).height() );
                }
            }
        });
    }, 500);
});