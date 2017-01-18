'use strict';
module.exports = function(db) {
  Object.keys(db.sequelize.models)
    .map(m => db.sequelize.model(m))
    .filter(m => m.relocate instanceof Function)
    .map( model => {

      let relocatees = model.relocate();
      let knownRelocatees = Object.keys(relocatees);
      let associates = Object.keys(model.associations);

      associates
        .map(a => model.associations[a])
        .filter(a => a.associationType === 'HasMany')
        .filter(a => knownRelocatees.indexOf(a.as) > -1)
        .map(association => {
          association.source.hook('beforeDestroy', (record, options) => {

            let relocation = {
              value: {},
              where: {},
            };

            relocation.value[association.foreignKey] = relocatees[association.as];
            relocation.where[association.foreignKey] = record.id;

            return association.target.update(relocation.value, {where: relocation.where});

          });
        });
    });
};