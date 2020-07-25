jQuery(document).ready(function() {
  console.log('test_airtable');
  var Airtable = require('airtable');
  // Read-only key
  var api_key = "keyMmAL4mVBSORkGc";
  var base = new Airtable({apiKey: api_key}).base('appj3UWymNh6FgtGR');

  // await has to be inside async function, anonymous in this case
	(async () => {
    var category_records = await getTable('Categories', base);
    var subcategory_records = await getTable('Subcategories', base);
    var provider_records = await getTable('Help Services', base);
    category_data = mergeTables(category_records, subcategory_records, provider_records);
    init_dom(category_data);
	})()
});

function init_dom(category_data) {
  category_data.forEach(function (record) {
    console.log(record.Name, record.Order, record.Subcategories.length);
    tmp_html = '<h3>'+record.Name+' - '+record.NameES+', '+record.Order+', '+record.Subcategories.length+'</h3>';
    jQuery("#categories_subcategories").append(tmp_html);
    jQuery("#all").append(tmp_html);
    record.Subcategories.forEach(function(record) {
      if (record.Providers.length > 0) {
        console.log('  ', record.Name, record.Order, record.Providers.length);
        // tmp_html = '<p>'+record.Name+' '+record.Order+' '+record.Providers.length+'</p>';
        tmp_html = record.Name+' - '+record.NameES+', '+record.Order+', '+record.Providers.length+'<br>';
        jQuery("#categories_subcategories").append(tmp_html);
        tmp_html = '<p><b>'+record.Name+' - '+record.NameES+', '+record.Order+', '+record.Providers.length+'</b></p>';
        jQuery("#all").append(tmp_html);
        record.Providers.forEach(function(record) {
          console.log('    ', record.get('Name'));
          tmp_html = record.get('Name')+'<br>';
          jQuery("#all").append(tmp_html);
        });
      }
    });
  });
}

function mergeTables(category_records, subcategory_records, provider_records) {
  //
  // CATEGORIES
  //
  category_records.sort((a, b) => (a.get('Order') - b.get('Order')));
  category_data = category_records.map(function(record) {
    category_name = record.get('Name');
    category_id = record.id;
    // Initialize a no-subcategory subcategory bucket for providers with no subcategories at index 0.
    none_subcategory_record = {'ID' : '<none>', 'CategoryID' : category_id, 'Name' : 'No subcategories', 'NameES' : 'No hay subcategorias', 'Order' : 0, 'Providers' : []}
    return {
      'ID' : category_id, 'Name' : category_name, 'NameES' : record.get('Name-ES'), 'Order' : record.get('Order'), 'Subcategories' : [none_subcategory_record]
    };
  });

  //
  // SUBCATEGORIES
  //
  console.log('*** Processing subcategories');
  subcategory_records.sort((a, b) => (a.get('Order') - b.get('Order')));
  // logRecords('Subcategories', subcategory_records);
  subcategory_data = subcategory_records.map(function(record) {
    // !!!NOTE misspelling. Correct in table?
    subcategory = record.get('Name');
    category = record.get('Catagory');
    if (!category) {
        console.log('Subcategory', subcategory, 'has no category.');
    }
    return {
      'ID' : record.id, 'CategoryID' : (category ? category[0] : ''), 'Name' : subcategory, 'NameES' : record.get('Name-ES'), 'Order' : record.get('Order'), 'Providers' : []
    };
  });
  // Fold into the Category table
  subcategory_data.forEach(function(record) {
      category_id = record.CategoryID;
      if (category_id) {
        category_index = category_data.findIndex(category => category.ID == category_id)
        category_data[category_index].Subcategories.push(record)
      } else {
        console.log('no category id', record.Name);
      }
  });

  //
  // PROVIDERS
  //
  console.log('*** Processing providers');
  provider_records.sort(function(a, b){
    if(a.Name < b.Name) { return -1; }
    if(a.Name > b.Name) { return 1; }
    return 0;
  });
  // logRecords('Providers', provider_records);
  // Fold into the Category table
  provider_records.forEach(function(record) {
    category_id = record.get('Category');
    if (category_id) {
      category_index = category_data.findIndex(category => category.ID == category_id)
      if (category_index >= 0) {
        subcategory_id = record.get('Subcategory');
        if (subcategory_id) {
          subcategory_index = category_data[category_index].Subcategories.findIndex(subcategory => subcategory.ID == subcategory_id)
          if (subcategory_index >= 0) {
            category_data[category_index].Subcategories[subcategory_index].Providers.push(record)
          } else {
            console.log('no subcategory index', record.get('Name'), subcategory_id, "THIS SHOULDN'T OCCUR");
          }
        } else {
          console.log('no subcategory id', record.get('Name'));
          subcategory_index = 0;
          category_data[category_index].Subcategories[subcategory_index].Providers.push(record)
        }
      } else {
        // If no subcategory, throw in the no-subcategory subcategory bucket at index 0
        console.log('no category index', record.get('Name'), "THIS SHOULDN'T OCCUR");
      }
    } else {
      console.log('no category id', record.get('Name'), "THIS SHOULDN'T OCCUR");
    }
  });

  console.log(category_data);
  console.log(subcategory_data);
  return category_data;
}

function logRecords(table_name, records) {
  console.log('***', table_name, records.length);
  records.forEach(record => console.log('  ', record.id, record.get('Order'), record.get('Name')));
}

// async function getTable(tablename, base) {
function getTable(tablename, base) {
  return new Promise(function (resolve) {
    var records_buffer = [];
		base(tablename).select({
			// Selecting the first 3 records in Grid view:
			// maxRecords: 3,
			maxRecords: 1000,
			view: "Grid view"
		}).eachPage(function page(records, fetchNextPage) {
			// This function (`page`) will get called for each page of records.
			records.forEach(function(record) {
				records_buffer.push(record);
			});
			// To fetch the next page of records, call `fetchNextPage`.
			// If there are more records, `page` will get called again.
			// If there are no more records, `done` will get called.
			fetchNextPage();
    }, function done(err) {
			if (err) { console.error(err); return; }
			resolve(records_buffer);
		})
  })
}