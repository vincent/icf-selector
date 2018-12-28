(function(){

fetch('./ICF.fr.json')
  .then(res => res.json())
  .then(data => {
    fillDataset(data)
    $('.typeahead').focus().on('keyup', e => datasetSearch(e.target.value))
  });



///////////////////////////////////////////////
///////////////////////////////////////////////

const categories = {};
let currentTerm = null;

function fillDataset(data) {
  const roots = JSON.parse(JSON.stringify(ofLevel(data, 1)));
  roots.forEach(root => {
    const leafs = leafsOfChapter(data, root.name);
    root.children = asList(leafs, root, 2);
  })

  roots.forEach(root => {
    categories[root.id] = true;
    // fill navigable tree
    $('.root-dataset').append(root.children);
    // register category button
    $('.category-toggles').append(button(root.name, { category: root.id }));
  });
  // listen to category button
  $('.category-toggles .btn').click(e => {
    const btn = $(e.target);
    btn.toggleClass('active');
    btn.toggleClass('btn-primary');
    btn.toggleClass('btn-secondary');
    const cid = btn.data().category;
    categories[cid] = !categories[cid];
    if (currentTerm) datasetSearch(currentTerm);
  })
  // listen to code spans
  $(document).on('dblclick', '.icf-code', e => {
    copy(e.target.innerHTML)
  });
  // listen to enterkey
  $(document).on('keypress', e => {
    if (e.charCode !== 13) return;
    const hovered = $('.item-path:hover .icf-code');
    if (hovered.length) {
      copy(hovered.get(0).innerHTML);
    }
  });
}

function button(text, data) {
  return $(`<button type="button" class="active btn btn-primary">${text}</button>`).data(data);
}

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

  const element$ = $(`<li data-category="${root.id}">`);
  const subList$ = $(`<ul class="collapse" id="collapse-${root.id}"></ul>`);

  element$.append(
    `<div class="item-path">
      <span class="icf-code">${root.id}</span>
      <span class="title" data-toggle="collapse" data-target="#collapse-${root.id}" aria-expanded="false" aria-controls="collapse-${root.id}">${root.path.slice(-1)[0]}</span>
    </div>`,
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
    if (item.content.inclusions)  html += `<p class="item-inclusions">${item.content.inclusions}</p>`;
    if (item.content.exclusions)  html += `<p class="item-inclusions">${item.content.exclusions}</p>`;
    html += '</blockquote></div>';
  }
  return html;
}

function datasetSearch(terms) {
  if (terms.length < 2) return;
  currentTerm = terms;

  $('ul', '.root-dataset').removeClass('show');
  $('li', '.root-dataset').hide();

  const parents = Object.keys(categories)
    .filter(c => categories[c])
    .map(c => `.root-dataset [data-category="${c}"]`)
    .join(', ');

  const clean = currentTerm.split(/\s+/g).map(s => s.trim()).filter(s => !!s);
  if (! clean.length) return;

  const res = clean.map(s => new RegExp(s, 'i'));
  $('.title, .blockquote, .icf-code', parents).each((_, e) => {
    if (res.every(re => e.innerHTML.match(re))) {
      $(e).parents('ul, div').addClass('show');
      $(e).parents('li').show();
    }
  })
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

})();