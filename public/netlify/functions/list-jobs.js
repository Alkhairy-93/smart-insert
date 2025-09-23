const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

exports.handler = async function(event, context) {
    try {
        // Chemin vers le dossier des offres d'emploi
        const jobsPath = path.join(process.cwd(), 'content', 'jobs');
        
        // Lire les fichiers Markdown
        const files = fs.readdirSync(jobsPath);
        const jobs = files.map(filename => {
            const filePath = path.join(jobsPath, filename);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data: frontmatter, content } = matter(fileContent);
            
            return {
                slug: filename.replace('.md', ''),
                frontmatter,
                content
            };
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify(jobs)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur lors du chargement des offres' })
        };
    }
};