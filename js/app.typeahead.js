(function(){

function setupTypeAhead() {
  var icfitems = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('search'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: {
      url: './ICF.fr.json',
      filter: function(data) {
        fillDataset(data);
        return $.map(data, d => {
          const search = []
            .concat(
              d.id,
              d.name,
              d.content ? Object.values(d.content) : ''
            )
            .join(' ')
            .replace(/[^a-z0-9éèëàâôùìïî' ]/gi, '');
          return  { ...d, search };
        })
      },
      datumTokenizer: function(d) { 
        return Bloodhound.tokenizers.whitespace(d.search); 
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace
    }
  });
  return $('.typeahead')
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
        suggestion: item => {
          let incexlu = '';
          if (item.content && (item.content.inclusion || item.content.exclusion)) {
            incexlu += '<ul>';
            if (item.content.inclusions) incexlu += `<li class="item-inclusions">${item.content.inclusions}</li>`;
            if (item.content.exclusions) incexlu += `<li class="item-exclusions">${item.content.exclusions}</li>`;
            incexlu += '</ul>';
          }
          return `<div>
            <div class="item-path"><strong>${item.path[0]}</strong> ${item.path.slice(1).map((p, i) => (new Array(i*4)).join('&nbsp;')+' > '+p ).join('<br>')}</div>
            <div class="item-description"><strong>${item.id}</strong> ${item.content ? item.content.description : item.name}</div>
            ${incexlu}
          </div>`;
        }
      }
    })
    // .on('blur', _ => $('.root-dataset').removeClass('hidden'))
    // .on('typeahead:changed', _ => {
    //   $('.root-dataset').addClass('hidden');
    // })
    .on('click keyup', e => {
      $('.root-dataset').toggleClass('hidden', !!e.target.value)
    })
    .bind('typeahead:selected', (obj, selected, name) => {
      copy(selected.id);
      $('.typeahead').focus().select();
    });
}

function fillDataset(data) {
  const roots = JSON.parse(JSON.stringify(ofLevel(data, 1)));
  roots.forEach(root => {
    const leafs = leafsOfChapter(data, root.name);
    root.children = asList(leafs, root, 2);
  })

  roots.forEach(root => $('.root-dataset').append(root.children));
}

///////////////////////////////////////////////
///////////////////////////////////////////////

function ofLevel(data, level) {
  return data.filter(c => c.path.length === level);
}

function leafsOfChapter(data, chapter) {
  return data.filter(c => c.path.length > 1 && c.path[0] === chapter);
}

function asList(data, root, level) {
  const deepper = [];
  const thisLevel = [];
  data.forEach(item => {
    if (root.path.every(p => item.path.indexOf(p) > -1)) {
      if (item.path.length === level) thisLevel.push(item);
      else if (item.path.length > level) deepper.push(item);
    }
  })
  if (thisLevel.length === 0) return '';

  const element$ = $('<li>');
  const subList$ = $(`<ul class="collapse" id="collapse-${root.id}"></ul>`);

  element$.append(
    `<span class="icf-code">${root.id}</span>`,
    `<span class="title" data-toggle="collapse" data-target="#collapse-${root.id}" aria-expanded="false" aria-controls="collapse-${root.id}">${root.path.slice(-1)[0]}</span>`,
    subList$
  );

  thisLevel.map(item => {
    if (! deepper.length) {
      subList$.append(asItem(item));
    } else {
      subList$.append(asList(deepper, item, level + 1))
    }
  });

  return element$;
}

function asItem(item) {
  const html = `
    <li data-id="${item.id}" class="item-path">
      <span class="icf-code">${item.id}</span>
      <span class="title item-path" data-toggle="collapse" data-target="#collapse-details-${item.id}" aria-expanded="false" aria-controls="collapse-details-${item.id}">${item.name}</span>
      ${description(item)}
    </li>
  `;
  return html;
}

function description(item) {
  let html = '';
  if (item.content.description || item.content.inclusions || item.content.exclusions) {
    html = `<div class="collapse" id="collapse-details-${item.id}">`;
    html += '<blockquote class="blockquote">';
    if (item.content.description) html += item.content.description;
    if (item.content.inclusions) html += `<p class="item-inclusions">${item.content.inclusions}</p>`;
    if (item.content.exclusions) html += `<p class="item-inclusions">${item.content.exclusions}</p>`;
    html += '</blockquote></div>';
  }
  return html;
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

setupTypeAhead().focus();

})();