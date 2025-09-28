const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Autoriser CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };

    // Répondre aux préreques CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
        const AIRTABLE_BASE = process.env.AIRTABLE_BASE;

        if (!AIRTABLE_KEY || !AIRTABLE_BASE) {
            throw new Error('Variables d\'environnement manquantes');
        }

        // URL pour récupérer l'enregistrement existant
        const urlGet = `https://api.airtable.com/v0/${AIRTABLE_BASE}/Views?filterByFormula={Page}='smart-insert.netlify.app'`;
        
        const resGet = await fetch(urlGet, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_KEY}`
            }
        });

        if (!resGet.ok) {
            throw new Error(`Erreur Airtable: ${resGet.status} ${resGet.statusText}`);
        }

        const data = await resGet.json();

        if (!data.records || data.records.length === 0) {
            // Créer un nouvel enregistrement si aucun n'existe
            const urlCreate = `https://api.airtable.com/v0/${AIRTABLE_BASE}/Views`;
            const createRes = await fetch(urlCreate, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        Page: 'smart-insert.netlify.app',
                        Count: 1
                    }
                })
            });

            if (!createRes.ok) {
                throw new Error(`Erreur création Airtable: ${createRes.status}`);
            }

            const newRecord = await createRes.json();

            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    count: 1,
                    message: 'Nouveau compteur créé'
                })
            };
        }

        // Mettre à jour l'enregistrement existant
        const record = data.records[0];
        const newCount = (record.fields.Count || 0) + 1;

        const updateRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Views/${record.id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${AIRTABLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    Count: newCount,
                    LastUpdated: new Date().toISOString()
                }
            })
        });

        if (!updateRes.ok) {
            throw new Error(`Erreur mise à jour Airtable: ${updateRes.status}`);
        }

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                count: newCount,
                message: 'Compteur mis à jour avec succès'
            })
        };

    } catch (err) {
        console.error('Erreur dans la fonction compteur:', err);
        
        return {
            statusCode: 500,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                error: err.message,
                count: 0
            })
        };
    }
};