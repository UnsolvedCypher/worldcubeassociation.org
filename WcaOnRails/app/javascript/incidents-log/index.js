let incidentsBootstrapTable = null;
let $incidentsTagsInput = null;
let $incidentsSearchInput = null;


function updateUrlParams($searchInput, $tagsInput) {
  // Update params in the url.
  const params = {
    search: $searchInput.val(),
    tags: $tagsInput.val(),
  };
  $.setUrlParams(params);
}

function loadUrlParams() {
  const params = $.getUrlParams();
  return {
    tags: params.tags || '',
    search: params.search || '',
  };
}

// Can't use filterBy, as some cells have multiple value, so we have to use a custom search
function customIncidentsSearch(text) {
  // See the hack to force refresh below...
  if (!incidentsBootstrapTable) {
    incidentsBootstrapTable = this;
  }
  if (text.length === 0) {
    // Hack because bootstrap table does the search but doesn't get the filtered
    // data unless "this.searchText" has non-zero length.
    // See here: https://github.com/wenzhixin/bootstrap-table/blob/22ca907e623ab696fd9711f497989cd30abb5d23/src/bootstrap-table.js#L2395-L2398
    this.searchText = ' ';
  }
  const tags_value = $incidentsTagsInput ? $incidentsTagsInput.val() : '';
  const filter_tags = tags_value.length > 0 ? tags_value.split(',') : [];
  this.data = this.options.data.filter((item) => {
    // item[1] is the incidents' tags
    const tags = item._1_data.tags.split(',');
    const filtered = tags.filter((tag) => filter_tags.includes(tag));
    if (filter_tags.length > 0 && filtered.length === 0) {
      return false;
    }
    // item[0] is actually a link with the title, so we need to turn it into an element
    // then take its text.
    const incident_title = $(item[0]).text();
    return incident_title.indexOf(text) != -1;
  });
}

function activatePopover() {
  $('[data-toggle="popover"]').popover();
}

wca.initIncidentsLogTable = function (selectizeOptions, $table, $searchInput, $tagsInput) {
  $incidentsTagsInput = $tagsInput;
  $incidentsSearchInput = $searchInput;
  $table.bootstrapTable('refreshOptions', { customSearch: customIncidentsSearch });

  $table.on('search.bs.table', () => {
    // Yep, when it's filtered we need to reactivate popovers :(
    activatePopover();
    updateUrlParams($searchInput, $tagsInput);
  });
  $table.on('page-change.bs.table', () => {
    activatePopover();
  });

  // It's a search filter input, so there is no point to allow user to create tags
  delete selectizeOptions.create;
  selectizeOptions.onChange = function (value) {
    // Hack to force refresh
    if (incidentsBootstrapTable) {
      incidentsBootstrapTable.searchText = ' ';
    }
    $table.bootstrapTable('resetSearch', $searchInput.val());
    updateUrlParams($searchInput, $tagsInput);
  };
  selectizeOptions.maxOptions = 5;
  const params = loadUrlParams();
  $tagsInput.val(params.tags);
  $tagsInput.selectize(selectizeOptions);
  $table.bootstrapTable('resetSearch', params.search);
};

wca.searchIncidentsForTag = function (e, tag) {
  e.preventDefault();
  $incidentsSearchInput.val('');
  const { selectize } = $incidentsTagsInput[0];
  selectize.clear();
  selectize.addItem(tag);
};
