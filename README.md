# backbone.crossfilter
A Crossfilter port to Backbone Framework.


// instanciation du plugin CrossFilter
var myBCfilter = new backbone.crossfilter({
	config: {
		attributs: [ "attribute1", "attribute2", "attribute3" ],
	}
});

Here you instantiate the filter with a configuration JSON which has an array "attributs" with the attributes you want to look at.
Then, you instantiate the filtered collection with the method myBCfilter.getFilterCollection() wich return a Backbone collection,
and you can do what you want with.
For example, you can turn on the backbone comparator with one of your attributes and pass it to a view.

var filteredCollection = myBCfilter.getFilterCollection();
filteredCollection.comparator = 'attribute3';
var myView = new View({collection: filteredCollection});

// instanciation vues filtres
Now you have set your filter and have a reference to the filter output "filteredCollection", you have access to backbone collections of 
criterias with the method myBCfilter.access("attribute").
It gives you a collection of all the choices possible within the category you want to look at.
You will pass these collections to their views that you had already set up.

var auteursVue    = new CriteriaView({collection: myBCfilter.access("attribute1")}),
	genresVue     = new CriteriaView({collection: myBCfilter.access("attribute2")}),
	editionsVue   = new CriteriaView({collection: myBCfilter.access("attribute3")}),

The Criteria model is build for you with this schema :

var Criteria = Backbone.Model.extend({
	defaults: {
		coche: false,
		type: "attribute1",
		nom: "choice1",
		nombre: "7"
	},
})

and it has a method myCriteria.prepaF() that you must call when you get a click event in your view (here a marionette view).

myCriteriaView = Marionette.ItemView.extend({
	ui: { 'filter': 'input' },
	events: {
		'click @ui.filter': 'prepaF',
	},
	prepaF: function(){
		this.model.prepaF();
	},
});

if you have read this far and already tried to use this plugin, it has not worked !
The final method you must use to complete the task is myBCfilter.buildFilter(myCollection) to pass the collection 
you want to filter to your backbone.crossfilter instance. I do it in the fetch''s success callback to be sure to 
have the entire collection in my filter.

myBaseCollection.fetch({
	success: function(collection){
		myBCfilter.buildFilter(collection);
	},
});

Now you gonna kick this collection'' ass and filter it up your desires.
If you keep your Backbone or Marionette views tight linked to your collections/models, whenever a criteria is clicked 
your views are rendered automatically but maybe you want to update the data in your filtered collection manually.
This is possible with the method myBCfilter.updateFilter().

For convenience, you have access to the IDs of the filtered models in the base collection with the method myBCfilter.getSortedIDs().
Like the name told it, they are sorted.

Enjoy ! \o/