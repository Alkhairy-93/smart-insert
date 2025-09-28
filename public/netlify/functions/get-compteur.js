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

        let currentCount = 0;
        if (data.records && data.records.length > 0) {
            currentCount = data.records[0].fields.Count || 0;
        }

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: JSON.stringify({ 
                count: currentCount,
                lastUpdated: new Date().toISOString()
            })
        };

    } catch (err) {
        console.error('Erreur dans la fonction get-compteur:', err);
        
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