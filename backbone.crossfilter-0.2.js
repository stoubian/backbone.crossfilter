(function (window, factory) {
	'use strict';

	console.log('window ' , window);
	console.log('factory ' , factory);

	if (typeof define === 'function' && define.amd) {
		define(['backbone', 'underscore', 'crossfilter'], function (Backbone, _) {
			return factory(window, Backbone, _);
		});
	} else if (typeof exports !== 'undefined') {
		module.exports = factory(window, require('Backbone'), require('underscore'), require('crossfilter'));
	} else {
		factory(window, window.Backbone, window._);
	}

}(this, function (window, Backbone, _) {
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
						coche: false,
						type: "NA",
						nom: "NA",
						nombre: "NA"
					},
					prepaF: function(){
						if(this.get('coche')){
							this.set('coche', false);
						} else {
							this.set('coche', true);
						}

						var data = {
							filtreType: this.get('type'),
							filtreValeur: this.get('nom'),
							filtreCoche: this.get('coche'),
						};
						moduleCF.setFiltre(data);
					}
				})
			);

			var CriteriaGroup = Backbone.Collection.extend({
					model: this.get('criteria'),
				}),
				LivresFiltres = Backbone.Collection.extend();

			this.set('filteredCollection', new LivresFiltres() );
			this.set('config', opts.config);
			_.each(this.get('config').attributs, function (att){
				moduleCF.get('critereCollection')[att] = new CriteriaGroup();
			});

			app.vent.on('livre:clic', function (donnees){
				moduleCF.clicFiltre(donnees);
			});
			console.log('this ' , this);
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
			this.updateFilter();
		},
		updateFilter: function (){
			this.set( 'donneesFiltrees', this.get('dimension')[this.get('config').attributs[0]].top(Infinity) );

			var moduleCF = this,
				filterBuffer = [],
				IDs = this.getSortedIDs();

			_.each(IDs, function (id){
				filterBuffer.push(moduleCF.get('baseCollection').get(id));
			});
			this.get('filteredCollection').set(filterBuffer);

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
			var config = moduleCF.get('config').attributs;

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
		getSortedIDs: function (){
			return _.pluck(this.get('donneesFiltrees'), 'id').sort();
		},
	});

	return Backbone.Crossfilter;
}));
