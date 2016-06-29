$(document).ready(function() {

    var startDate = new Date();
    var offset = 0; // for pagination
    var count = 1000; // as many as possible

    setInterval(function() {
        console.log(`offset = ${offset}, count = ${count}`)

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
                    var contents = JSON.stringify(msg.message);

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

                    $('#messageTable').append(`<tr><td class="message">${msg.received}</td><td>${msg.type}</td><td><img src="${img}" style="vertical-align:middle"/> ${msg.origin}</td><td>${msg.channel}</td><td class="message">${contents}</td></tr>`);
                });

                offset += data.length;

                if (atBottom) {
                    $('html, body').scrollTop( $(document).height() );
                }
            }
        });
    }, 500);
});