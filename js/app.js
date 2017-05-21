window.$ = window.jQuery = require('jquery');
var ipcRenderer = require('electron').ipcRenderer;
var clipboard = require('electron-clipboard-extended');

var currentIndex = -1;

$(function() {
  setListeners();
  console.log(process.versions);
});

function setListeners() {
  ipcRenderer.on('history-changed', function(e, history) {
    updateTable(history);
  });

  // Arrow keys
  $(document).keydown(function(e) {
    switch(e.which) {
      case 13: // enter
        if(currentIndex != -1){
          setClipboard(currentIndex);
        }
        break;

      case 38: // up
        if(currentIndex > 0){
          currentIndex--;
        }
        selectRow(currentIndex);
        break;

      case 40: // down
        if(currentIndex == -1){
          currentIndex = 0;
        } else if(currentIndex < $('.results table tr').length - 1){
          currentIndex++;
        }
        selectRow(currentIndex);
        break;

      default: return; // exit this handler for other keys
    }

    e.preventDefault(); // prevent the default action (scroll / move caret)
  });

  $('.logo').on('click', function(e){
    ipcRenderer.send('history-changed', 'clear');
    $('.results table').html('');
  })
}

function selectRow(index){
  $('.results table tr').removeClass('selected');

  var row = $('.results table tr')[index];
  $(row).addClass('selected');
}

function updateTable(history){
  var $table = $('.results table');
  $table.html('');

  $.each(history, function(i, item) {
    var html = '<tr><td class="item">' + item + '</td><td class="index">' + (i + 1) + '</td>';
    $table.append(html);
  });
}

function setClipboard(index){
  var value = $('.selected .item').text();
  clipboard.writeText(value);
}
