(function (root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['backbone', 'underscore', 'crossfilter'], function (Backbone, _, Crossfilter) {
			return factory(Backbone, _);
		});
	} else if (typeof exports !== 'undefined') {
		var Backbone 	= require('Backbone'),
			_ 			= require('underscore'),
			Crossfilter = require('crossfilter');
		module.exports = factory(Backbone, _, Crossfilter);
	} else {
		factory(root.Backbone, root._, root.Crossfilter);
	}

}(this, function (Backbone, _, Crossfilter) {
	'use strict';

	Backbone.Crossfilter = Backbone.Model.extend({
		defaults: {
			dimension: {},
			groupe: {},
			filtresActifs: {},
			critereCollection: {},
		},
		initialize: function (opts){
			var moduleCF = this;

			this.set('criteria', 
				Backbone.Model.extend({
					defaults: {
						checked: false,
						type: "NA",
						nom: "NA",
						nombre: "NA"
					},
					prepaF: function(){
						this.set('checked', !this.get('checked'));

						var data = {
							filtreType: this.get('type'),
							filtreValeur: this.get('nom'),
							filtreCoche: this.get('checked'),
						};
						moduleCF.setFiltre(data);
					}
				})
			);

			var CriteriaGroup = Backbone.Collection.extend({
					model: this.get('criteria'),
				}),
				FilteredCollection = Backbone.Collection.extend();

			this.set('filteredCollection', new FilteredCollection());
			this.set('config', opts.config);
			_.each(this.get('config').attributs, function (att){
				moduleCF.get('critereCollection')[att] = new CriteriaGroup();
			});

			app.vent.on('livre:clic', function (donnees){
				moduleCF.clicFiltre(donnees);
			});
		},
		buildFilter: function (collec){
			var moduleCF = this,
				Criteria = this.get('criteria');

			// creation base de données crossfilter
			this.set('baseCollection', collec);
			this.set('superfiltre', crossfilter(
				_.map(collec.models, function (model){
					return model.attributes;
				})
			));

			//creation dimensions et groupes crossfilter
			_.each(moduleCF.get('config').attributs, function (att){
				moduleCF.get('dimension')[att] = moduleCF.get('superfiltre').dimension(function (d) { return d[att]; });
				moduleCF.get('groupe')[att] = moduleCF.get('dimension')[att].group().all();
				moduleCF.get('filtresActifs')[att] = [];
			});

			// Collections de criteres possibles traduits en Marionette
			_.each(moduleCF.get('groupe'), function (grp, grpName){
				_.each(grp, function (crit){
					moduleCF.get('critereCollection')[grpName].add(new Criteria({
						type: grpName,
						nom: crit.key,
						nombre: crit.value
					}));
				});
			});
			this.get('filteredCollection').reset(moduleCF.get('baseCollection').models);
			this.updateFilter();
		},
		updateFilter: function (){
			var moduleCF     = this,
				// filterBuffer = [],
				baseIDs      = this.getIDs(this.get('filteredCollection').models),
				fIDs         = this.getIDs();

			this.set('notFIDS', _.difference(baseIDs, fIDs));

			_.each(fIDs, function (id){
				if (_.indexOf(baseIDs, id) === -1){
					moduleCF.get('filteredCollection').add(moduleCF.get('baseCollection').get(id));
				}
			});
			_.each(this.get('notFIDS'), function (id){
				if (_.indexOf(baseIDs, id) > -1){
					moduleCF.get('filteredCollection').remove(moduleCF.get('baseCollection').get(id));
				}
			});

			/*// weird behavior on removing all filters : 
			_.each(fIDs, function (id){
				filterBuffer.push(moduleCF.get('baseCollection').get(id));
			});
			this.get('filteredCollection').set(filterBuffer, { merge: false });*/

			//met à jour les sommes de critères
			_.each(moduleCF.get('critereCollection'), function (collec){
				_.each(collec.models, function (mod){
					var monCritere = collec.get(mod.cid);
					_.each(moduleCF.get('groupe')[monCritere.get('type')], function (crit){
						if (crit.key === monCritere.get('nom')) {
							monCritere.set('nombre', crit.value);
						}
					});
				});
			});
		},
		setFiltre: function (data){
			var moduleCF = this;

			if(data.filtreCoche){
				moduleCF.get('filtresActifs')[data.filtreType].push(data.filtreValeur);
			} else {
				var pool_filtre = moduleCF.get('filtresActifs')[data.filtreType];
				var x = pool_filtre.indexOf(data.filtreValeur);
				pool_filtre.splice(x, 1);
			}

			_.each(moduleCF.get('dimension'), function (dim, key){
				if(moduleCF.get('filtresActifs')[key][0]){
					moduleCF.FFhelper(
						moduleCF.get('dimension')[key],
						moduleCF.get('filtresActifs')[key]
					);
				} else {
					moduleCF.get('dimension')[key].filterAll();
				}
			});
			this.updateFilter();
		},
		FFhelper: function (maDim, monFA){
			maDim.filterFunction(function (critere_possible){
				if(monFA.indexOf(critere_possible) >= 0){
					return critere_possible;
				}
			});
		},
		clicFiltre: function (donnees){
			var moduleCF = this;

			_.each(this.get('config').attributs, function (att){
				if (donnees.type === att){
					var critere = moduleCF.get('critereCollection')[att].findWhere({nom: donnees.nom_critere_clique});
					critere.prepaF();
				}
			});
		},
		access: function (attribut){
			return this.get('critereCollection')[attribut];
		},
		getFilterCollection: function (){
			return this.get('filteredCollection');
		},
		getIDs: function (list){
			return _.pluck(
				list || this.get('dimension')[this.get('config').attributs[0]].top(Infinity),
				'id'
			);
		},
		getInvIDs: function(){
			return this.get('notFIDS');
		},
		filterBy: function (dimension, attribute){
			var BaseCollectionConstructor = this.get('baseCollection').constructor,
				result = this.get('dimension')[dimension].filterExact(attribute).top(Infinity),
				resultColl = new BaseCollectionConstructor(result);
			return resultColl;
		},
	});

	return Backbone.Crossfilter;
}));
