#!/usr/bin/env node
import { Command } from 'commander';
import jsonfile from 'jsonfile';
import Sitemapper from 'sitemapper';
import { other, scenario, viewports } from './defaults.js';
const sitemap = new Sitemapper();

const combineContents = (name, scenarios = [], paths) => {
    return {
        ...{
            id: name,
            viewports: viewports,
            scenarios: scenarios,
            paths: paths,
        },
        ...other
    }
}

const getSitemap = async (domain, www) => {
    return await sitemap.fetch(`https://${www ? 'www.' : ''}${domain}/sitemap.xml`)
}

const createConfig = async (domain, reference = null, directoryLimit = null) => {
    const scenarios = []
    let res = await getSitemap(domain)
    if (!res.sites.length) {
        console.log(`Sitemap not found, trying www.${domain}`)
        res = await getSitemap(domain, true)
    }
    if (res.sites.length) {
        console.log(`Sitemap ${domain} ok, found ${res.sites.length} pages. Creating config`, domain)
        // Memoization object to track directory counts
        const directoryCounts = {}
        for (const key in res.sites) {
            if (res.sites.hasOwnProperty(key)) {
                const url = res.sites[key];
                let newScenario = {
                    label: url.replace(domain, '').replace(/https:|www.|http:|\/\//g, ''),
                    url: url,
                    referenceUrl: reference ? `${reference}${url.replace(domain, '').replace(/https:|www.|http:|\/\//g, '')}` : "",
                }
                if (directoryLimit) {
                    // Extract directory path (everything before the last segment)
                    const urlObj = new URL(url);
                    const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
                    const directory = pathSegments.length > 1 ? `/${pathSegments.slice(0, -1).join('/')}` : '/';
                    // Initialize count for directory if not exists
                    if (!directoryCounts[directory]) {
                        directoryCounts[directory] = 0;
                    }

                    // Only push scenario if under limit of directoryLimit per directory
                    if (directoryCounts[directory] < directoryLimit) {
                        scenarios.push({
                            ...newScenario,
                            ...scenario
                        })
                        directoryCounts[directory]++;
                    }
                }
                else {
                    scenarios.push({
                        ...newScenario,
                        ...scenario
                    })
                }
            }
        }
        const id = domain.replace(/\//g, "-")
        const paths = {
            "bitmaps_reference": id + "/bitmaps_reference",
            "bitmaps_test": id + "/bitmaps_test",
            "engine_scripts": id + "/engine_scripts",
            "html_report": id + "/html_report",
            "ci_report": id + "/ci_report"
        }
        jsonfile.writeFile(`./${id}.json`,
            combineContents(id, scenarios, paths),
            { spaces: 2 },
            function (err) {
                if (err) console.error(err)
            })
        if (directoryLimit) {
            console.log(`Succesfully generated config for ${scenarios.length} pages on`, domain)
        }
        console.log("run: npm run setup", id)
        console.log("to generate a reference report")
    } else {
        console.log(`ERROR: Sitemap not found or empty, make sure ${res.url} exist`)
    }
}

const program = new Command()

program
    .version('1.0.0')
    .description("An CLI used to generate backstop configs from sitemaps")
    .argument('<url>', 'Set url')
    .option('-d, --domains <lang,lang>', 'Set of domains extentions to check ex; de,com')
    .option('-r, --reference <url>', 'Reference url')
    .option('-l, --directory-limit <int>', 'Limit the number of pages tested per directory')

program.parse()

const options = program.opts();

const site = program.args[0];
const reference = options.reference ?? null;
const directoryLimit = options.directoryLimit ?? null;

if (directoryLimit && directoryLimit <= 0) {
    throw new Error('--directory-limit should be greater than 0')
    process.exit(1)
}

if (options.domains) {
    console.log("Creating config for", site)
    program.domains = program.domains.split(",")
    createConfig(program.site, reference, directoryLimit)
    for (const key in program.domains) {
        if (options.domains.hasOwnProperty(key)) {
            const extension = options.domains[key].indexOf('.') ? ('.' + options.domains[key]) : options.domains[key]; // if input is .de,.com instead of de,com,es for example; add a dot
            const domain = site.substring(0, site.indexOf('.')) // Strip domain extention
            createConfig(domain + extension, reference)
            createConfig(domain, reference, directoryLimit)
        }
    }
} else {
    createConfig(site, reference, directoryLimit)
}