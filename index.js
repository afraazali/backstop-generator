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

const createConfig = async (domain, reference = null) => {
    const scenarios = []
    let res = await getSitemap(domain)
    if (!res.sites.length) {
        console.log(`Sitemap not found, trying www.${domain}`)
        res = await getSitemap(domain, true)
    }
    if (res.sites.length) {
        console.log(`Sitemap ${domain} ok, found ${res.sites.length} pages. Creating config`, domain)
        for (const key in res.sites) {
            if (res.sites.hasOwnProperty(key)) {
                const url = res.sites[key];
                scenarios.push({
                    ...{
                        label: url.replace(domain, '').replace(/https:|www.|http:|\/\//g, ''), // Strip url except path to get page name ;)
                        url: url,
                        referenceUrl: reference ? `${reference}${url.replace(domain, '').replace(/https:|www.|http:|\/\//g, '')}` : "",
                    },
                    ...scenario
                })
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
        console.log(`Succesfully generated config for ${res.sites.length} pages on`, domain)
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

program.parse()

const options = program.opts();

const site = program.args[0];
const reference = options.reference ?? null;

if (options.domains) {
    console.log("Creating config for", site)
    program.domains = program.domains.split(",")
    createConfig(program.site, reference)
    for (const key in program.domains) {
        if (options.domains.hasOwnProperty(key)) {
            const extension = options.domains[key].indexOf('.') ? ('.' + options.domains[key]) : options.domains[key]; // if input is .de,.com instead of de,com,es for example; add a dot
            const domain = site.substring(0, site.indexOf('.')) // Strip domain extention
            createConfig(domain + extension, reference)
        }
    }
} else {
    createConfig(site, reference)
}

