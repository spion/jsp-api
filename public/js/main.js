$.mobile.defaultPageTransition = 'none';
$.mobile.defaultDialogTransition = 'none'
$.mobile.useFastClick = true;
$.mobile.buttonMarkup.hoverDelay = 15;

var dbtransform = function(db) {
    var o = {};
    for (var day in db) {
        for (var bus in db[day]) {
            var busday = db[day][bus],
                dir1 = busday[0], 
                dir2 = busday[1];

            var ymd = day.split('-').map(function(item) { return parseInt(item, 10); });
            if (!o[bus]) o[bus] = {};
            busday.forEach(function(direction) {
                if (!o[bus][direction.name]) o[bus][direction.name] = [];
                var arr = o[bus][direction.name];
                direction.times.forEach(function(time) {
                    var hm = time.when.split(':')
                        .map(function(item) { return parseInt(item, 10) });
                    var actualTime = new Date(ymd[0], ymd[1] - 1, ymd[2], hm[0], hm[1]);
                    o[bus][direction.name].push({when: actualTime, info:time.info});
                });
            });
        }
    }
    return o;
};


$("#main").bind('pageshow', function() {
   var now = new Date().getTime();
    var mylist = JSON.parse($.cookie('busses'));
    var busses = []; for (var key in mylist) if (mylist[key]) busses.push(key);
    if (busses.length) {
        $.getJSON('/api', {list: busses.join(',')}, function(res) {
            $("#main .list li").remove();
            var bl = dbtransform(res);
            for (var bus in bl) {
                var item = $("<li />").addClass('clearfix').appendTo($("#main .list"));
                $("<div />").addClass('bus')//.addClass('clearfix')
                    .text(bus).appendTo(item), locCnt = 0;

                var itemInfo = $("<div />").addClass('info')
                    //.addClass('clearfix')
                    .appendTo(item);
                for (var loc in bl[bus]) {
                    
                    var locDiv = $("<div />").addClass('loc').appendTo(itemInfo);
                    var locNameDiv = $("<div />").addClass('name')
                        .text(loc).appendTo(locDiv);
                    if (locCnt++) locNameDiv.addClass('second');
                    var timesDiv = $("<div />").addClass('times').appendTo(locDiv);

                    var times = bl[bus][loc], cntTimes = 0;
                    if (!times.length) 
                        $("<span />").addClass('time').text('Нема')
                            .appendTo(timesDiv);
                    var appendToDiv = function(t) {
                         $("<span />").addClass('time')
                                    .text(t.when.toLocaleTimeString().substr(0,5) + ' ' + t.info)
                                    .appendTo(timesDiv);
                          ++cntTimes;
                    }
                    for (var k = 1; k < times.length; ++k) {
                        if (times[k].when.getTime() > now) {
                            if (times[k - 1].when.getTime() < now) {
                                appendToDiv(times[k-1]);
                            }
                            appendToDiv(times[k]);
                            if (cntTimes > 2) break;
                        }
                    }
                    ++locCnt;
                }
            }
            $('#main .list').listview('refresh');
        });
    } else {
        $("#main .list li").remove();
        $('<li />').text("Кликни на + за да наместиш автобуси").appendTo('#main .list');
        $('#main .list').listview('refresh');
    }
});
$("#busses").bind('pageinit', function() {
    $.getJSON('/api/busses', function(arr) {
        $("#bus-select").html("")
        var mylist = JSON.parse($.cookie('busses'));
        mylist = mylist?mylist:{};
        arr.sort().forEach(function(item) {
            var cb = $("<input />").attr({
                type: 'checkbox', 
                name: 'busses', 
                'data-busid': item,
                checked: !!mylist[item]
            }).appendTo(
                $('<label />')
                .html(item)
                .appendTo('#bus-select'));
        });
        $("input[type='checkbox']").checkboxradio().bind('change', function() {
            mylist[$(this).attr('data-busid')] = $(this).is(':checked');
            $.cookie('busses', JSON.stringify(mylist), {expires: 999});
        });

    });
});
