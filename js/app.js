(function(){

function setupTypeAhead() {
  var icfitems = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: './ICF.json'
  });
  $('.typeahead')
    .typeahead({
      highlight: true,
      minLength: 1,
      hint: true
    },
    {
      name: 'icfitems',
      display: 'name',
      source: icfitems,
      templates: {
        suggestion: item => `
          <div>
            <div class="item-path">${item.path.join(' > ')}</div>
            <div class="item-description">${item.id} ${item.description || ''}</div>
          </div>
        `
      }
    })
    .bind('typeahead:selected', (obj, selected, name) => {
      copy(selected.id);
      $('.typeahead').focus()
      // $('.typeahead').get(0).select();
    })
    .off('blur');
}

function copy(text) {
  var input = document.createElement('input');
  input.setAttribute('value', text);
  document.body.appendChild(input);
  input.select();
  var result = document.execCommand('copy');
  document.body.removeChild(input)
  return result;
}

setupTypeAhead();

})();