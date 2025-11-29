const sequelize = require('../db/db.js');

/**
 * Vider la base de données
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.resetdb = async(req, res) =>{

    try {

        if (process.env.APP_ENV === 'production') 
        {
            return res.status(403).json({ error: 'Non autorisé de supprimer la base de données en production' });
        }else if(process.env.APP_ENV === 'recette' || process.env.APP_ENV === 'development' )
        {
            await sequelize.truncate({ cascade: true, restartIdentity: true });
            return res.status(201).json({message: " la base a été supprimé correctement"})
        }else
        {
            return res.status(403).json({ error: 'Non autorisé de supprimer la base de données en production' });
        }
           
    } catch (error) {
        return res.status(500).json({ error : " Une erreur est survenue lors de la suppression de la base de données. " } )
        
    }

}