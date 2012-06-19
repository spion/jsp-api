$.mobile.defaultPageTransition = 'none';
$.mobile.defaultDialogTransition = 'none'
$.mobile.useFastClick = true;
$.mobile.buttonMarkup.hoverDelay = 15;


function levenshtein (s1, s2) {
    // Calculate Levenshtein distance between two strings  
    // 
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/levenshtein
    // +            original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
    // +            bugfixed by: Onno Marsman
    // +             revised by: Andrea Giammarchi (http://webreflection.blogspot.com)
    // + reimplemented by: Brett Zamir (http://brett-zamir.me)
    // + reimplemented by: Alexander M Beedie
    // *                example 1: levenshtein('Kevin van Zonneveld', 'Kevin van Sommeveld');
    // *                returns 1: 3
    if (s1 == s2) {
        return 0;
    }
 
    var s1_len = s1.length;
    var s2_len = s2.length;
    if (s1_len === 0) {
        return s2_len;
    }
    if (s2_len === 0) {
        return s1_len;
    }
 
    // BEGIN STATIC
    var split = false;
    try {
        split = !('0')[0];
    } catch (e) {
        split = true; // Earlier IE may not support access by string index
    }
    // END STATIC
    if (split) {
        s1 = s1.split('');
        s2 = s2.split('');
    }
 
    var v0 = new Array(s1_len + 1);
    var v1 = new Array(s1_len + 1);
 
    var s1_idx = 0,
        s2_idx = 0,
        cost = 0;
    for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
        v0[s1_idx] = s1_idx;
    }
    var char_s1 = '',
        char_s2 = '';
    for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
        v1[0] = s2_idx;
        char_s2 = s2[s2_idx - 1];
 
        for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
            char_s1 = s1[s1_idx];
            cost = (char_s1 == char_s2) ? 0 : 1;
            var m_min = v0[s1_idx + 1] + 1;
            var b = v1[s1_idx] + 1;
            var c = v0[s1_idx] + cost;
            if (b < m_min) {
                m_min = b;
            }
            if (c < m_min) {
                m_min = c;
            }
            v1[s1_idx + 1] = m_min;
        }
        var v_tmp = v0;
        v0 = v1;
        v1 = v_tmp;
    }    
    return v0[s1_len];
}

function levenshteinPercent(s1, s2) {
    return levenshtein(s1,s2) / Math.max(s1.length, s2.length);
}


var dbtransform = function(db) {
    var now = new Date().getTime();
    var o = {};
    for (var day in db) {
        for (var bus in db[day]) {
            var busday = db[day][bus],
                dir1 = busday[0], 
                dir2 = busday[1];

            var ymd = day.split('-').map(function(item) { return parseInt(item, 10); });
            if (!o[bus]) o[bus] = {};
            for (var dir in busday) { direction = busday[dir]; 
                
                // Handle dumb JSP direction names written by dumb people. 
                // Like "Karposh-3" and "Karposh 3" which are the same, 
                // but for some inexplicable reason have different names.
                
                dir = dir.replace('нас.','');


                for (var odir in o[bus]) { 
                    var dirImportant = dir.split('(')[0],
                        odirImportant = odir.split('(')[0]
                    if (odir.indexOf(dir) >= 0 || dir.indexOf(odir) >= 0 ||
                            levenshteinPercent(odirImportant, dirImportant) < 0.5) { dir = odir; break; }
                }

                

                if (!o[bus][dir]) o[bus][dir] = [];
                var arr = o[bus][dir];
                direction.forEach(function(time) {
                    var hm = time.when.split(':')
                        .map(function(item) { return parseInt(item, 10) });
                    var actualTime = new Date(ymd[0], ymd[1] - 1, ymd[2], hm[0], hm[1]);
                    if (Math.abs(now - actualTime.getTime()) < 1000*60*60*12)
                        o[bus][dir].push({when: actualTime, info:time.info});
                });
                o[bus][dir].sort(function(a, b) { 
                    return a.when.getTime() - b.when.getTime();
                });
                o[bus][dir] = o[bus][dir]
                    .filter(function(item, i) { 
                        return i < 1 || 
                            o[bus][dir][i - 1].when.getTime()
                                - item.when.getTime() != 0;
                    });
                var lastTime = null;

            };
        }
    }
    return o;
};


var bl;


var downloadBusses = function() {
   var now = new Date().getTime();
    var mylist = JSON.parse($.cookie('busses'));
    var busses = []; for (var key in mylist) if (mylist[key]) busses.push(key);
    if (busses.length) {
        $.getJSON('/api', {list: busses.join(',')}, function(res) {
            $("#main .list li").remove();
            bl = dbtransform(res);
            $("#bus").trigger('downloaded');
            for (var bus in bl) {
                var item = $("<li />").addClass('clearfix').appendTo($("#main .list"));
                // on item click, open bus details
                //
                item.bind('vclick', function() {
                    var busn = $(this).find('.bus').text()
                    location.hash = '#bus?' + busn;
                    $("#bus").attr('data-url', location.hash)
                    $.mobile.changePage(location.hash, {changeHash: false});

                });

                $("<div />").addClass('bus')//.addClass('clearfix')
                    .text(bus).appendTo(item), locCnt = 0;

                var itemInfo = $("<div />").addClass('info')
                    //.addClass('clearfix')
                    .appendTo(item);
                for (var loc in bl[bus]) {
                    //if (!bl[bus][loc].times || !bl[bus][loc].times.length) continue;
                    var times = bl[bus][loc], cntTimes = 0;
                    if (!times.length) continue;
                    var locDiv = $("<div />").addClass('loc').appendTo(itemInfo);
                    var locNameDiv = $("<div />").addClass('name')
                        .text(loc).appendTo(locDiv);
                    if (locCnt++) locNameDiv.addClass('second');
                    var timesDiv = $("<div />").addClass('times').appendTo(locDiv);

                    var appendToDiv = function(t) {
                         $("<span />").addClass('time')
                                    .text(t.when.toLocaleTimeString()
                                            .substr(0,5) + ' ' + t.info)
                                    .appendTo(timesDiv);
                          ++cntTimes;
                    }
                    var lastWhen = 0;
                    for (var k = 1; k < times.length; ++k) {
                        if (times[k].when.getTime() > now) {
                            if (times[k - 1].when.getTime() < now) {
                                appendToDiv(times[k-1]);
                            }
                            // TODO: figure out why this actually happens
                            // instead of the workarround for dupes
                            if (Math.abs(times[k].when - lastWhen) > 0) {
                                appendToDiv(times[k]);
                                lastWhen = times[k].when;
                            }
                            if (cntTimes > 2) break;
                        }
                    }
                    ++locCnt;
                }
            }
            try {
                $('#main .list').listview('refresh');
            }catch (e) {}
        });
    } else {
        $("#main .list li").remove();
        $('<li />').text("Кликни на + за да наместиш автобуси").appendTo('#main .list');
        $('#main .list').listview('refresh');
    }
}

$("#main").bind('pageshow', downloadBusses);

$("#bus").bind('pageshow', function() {
    var bn = location.hash.split('?')[1];
    var updateBus = function() {
        $("#bus").unbind('downloaded');
        var detail = {name: bn, data: bl[bn]}; 
        $("#bus h1 .busname").text(detail.name);
        var now = new Date().getTime();
        $("#bus .content").html("");
        for (var dir in detail.data) {
            var times = detail.data[dir];
            var dirDiv = $("<div>").addClass('dir').appendTo('#bus .content');
            $("<div>").addClass('name').appendTo(dirDiv).text(dir);
            var timesDiv = $("<div>").addClass('times').appendTo(dirDiv);
            for (var k = 0; k < times.length; ++k) {
                if (times[k].when > now) {
                    $("<div>").addClass('time').appendTo(timesDiv).text(
                        times[k].when.toLocaleTimeString()
                        .substr(0,5) + ' ' + times[k].info)
                }
            }
        }
    }
    if (!bl) {
        var mylist = JSON.parse($.cookie('busses'));
        mylist = mylist?mylist:{};
        mylist[bn] = true;;
        $.cookie('busses', JSON.stringify(mylist), {expires: 999});
        $("#bus").bind('downloaded', updateBus);
        downloadBusses(); 
    }
    else updateBus();
});

$("#goto-busses").live('vclick', function() {
    $.mobile.changePage('#busses');
});

$("#busses").bind('pageshow', function() {

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
