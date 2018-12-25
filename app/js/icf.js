const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");

module.exports = (function() {

	const MAX_LIST_ITEMS = 10;

	let DATA = [];

	const CACHE_FILE = './ICF.json';

	const ICF_ROOT_NODES = [
		{ name: 'b FONCTIONS ORGANIQUES', path: [], id: 'b', expander: '1|5|fftf|23|b  FONCTIONS ORGANIQUES0|ICF\\b' },
		// { name: 's STRUCTURES ANATOMIQUES', path: [], id: 's', expander: '2|13|fftf|25|s  STRUCTURES ANATOMIQUES0|ICF\\s' },
		// { name: 'd ACTIVITÉS ET PARTICIPATION', path: [], id: 'd', expander: '3|21|fftf|29|d  ACTIVITÉS ET PARTICIPATION0|ICF\\d' },
		// { name: 'e FACTEURS ENVIRONNEMENTAUX', path: [], id: 'e', expander: '4|30|fftt|28|e  FACTEURS ENVIRONNEMENTAUX0|ICF\\e' }
	];
	
	const LANG = 'ICFFR';
	function setLanguage(lang) {
		LANG = {
			CN: 'ICFCN',  // Chinese
			EN: 'ICFEN2', // English
			FR: 'ICFFR',  // French
			RU: 'ICFRU',  // Russian
			SP: 'ICFSP'   // Spanish
		}[lang.toUpperCase()] || 'ICFEN2';
	}

	function rawData() {
		return DATA;
	}

	function loadICF() {
		return new Promise((resolve, reject) => {
			fs.exists(CACHE_FILE, exists => {
				if (exists) {
					fs.readFile(CACHE_FILE, (error, data) => {
						DATA = JSON.parse(data.toString());
						resolve()
					})
				} else {
					fetchTreeQueued().then(data => {
						DATA = data;
						fs.writeFile(CACHE_FILE, JSON.stringify(data), (error) => resolve())
					})
				}
			})
		})
	}

	// Fetch the whole tree
	function fetchTreeQueued() {
		return new Promise((resolve, reject) => {
			const list = [];

			var q = async.queue((node, next) => {
				fetchNodeChildren(node)
					.then(children => {
						children.forEach(c => {
							list.push(c)
							if (list.length > MAX_LIST_ITEMS) return;
							if (c.expander) q.push(c)
						});
						next();
					})
				});
	
			q.drain = _ => resolve(list);
			q.error = reject;
			// start scraping
			q.push(ICF_ROOT_NODES);
		});
	}

	// Fetch children of a single node
	function fetchNodeChildren(node) {
		return fetch(
			"http://apps.who.int/classifications/icfbrowser/Default.aspx", {
				"credentials": "include",
				"headers": {
					"Accept": "*/*",
					"Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
					"Cache-Control": "no-cache",
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
					"pragma": "no-cache",
					"Cookie": "ASP.NET_SessionId=zohljc55lovdefrn0bmbwavv; TS01ac0ef4_77=089aecc054ab28000fabed31a3e2bbe0e4b676f8726ca541083b8da534f8386c5cc933d451992ecb751921680895c73208904b86128240007b731882da65758eefcac80c06246a7c999ea74e42ee1a925fb015f43787dcf81424638c709624fa11025b145894498a7d1623dc63c36a54177a80fdbfc61633; TS01ac0ef4=015dd60f3eee1238a72b716955e1fc563a9dafaac2b2c96b808b400d325c3acb9420a67dd26c0b3cd7e22258ebfcd9fded5c1ae970536bd962a77d95cc1dbc2c4918bffd80; TS011d2310=015dd60f3e7d78a7ef56acb93834cc0f1018e6c7e2d2f63dede3190fceacc96d45757921c796f7bfa64c11e0fb8a3ea0e41a361adb",
					"Host": "apps.who.int",
					"Origin": "http://apps.who.int",
					"Pragma": "no-cache",
					"Referer": "http://apps.who.int/classifications/icfbrowser/Default.aspx",
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
				},
				"referrer": "http://apps.who.int/classifications/icfbrowser/Default.aspx",
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": "__EVENTTARGET=&__EVENTARGUMENT=&__LASTFOCUS=&ctl00_ContentPlaceHolder1_ClassificationTreeView1_ExpandState=ecccc&ctl00_ContentPlaceHolder1_ClassificationTreeView1_SelectedNode=&ctl00_ContentPlaceHolder1_ClassificationTreeView1_PopulateLog=&__VIEWSTATE=%2FwEPDwUJNzQ0MTA3OTY5D2QWAmYPZBYCAgMPZBYCAgMPEGQPFgZmAgECAgIDAgQCBRYGEAUNSUNGIC0gQ2hpbmVzZQUFSUNGQ05nEAUNSUNGIC0gRW5nbGlzaAUFSUNGRU5nEAUMSUNGIC0gRnJlbmNoBQVJQ0ZGUmcQBQ1JQ0YgLSBSdXNzaWFuBQVJQ0ZSVWcQBQ1JQ0YgLSBTcGFuaXNoBQVJQ0ZTUGcQBRJJQ0YgMjAxNyAtIEVuZ2xpc2gFBklDRkVOMmcWAQICZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAQUxY3RsMDAkQ29udGVudFBsYWNlSG9sZGVyMSRDbGFzc2lmaWNhdGlvblRyZWVWaWV3MdGRg6KZDtIpBWxKP3drItmiRy%2FF&__VIEWSTATEGENERATOR=6B601A37&ctl00%24LanguageDropDown=" + LANG + "&__CALLBACKID=ctl00%24ContentPlaceHolder1%24ClassificationTreeView1&__CALLBACKPARAM=" + encodeURIComponent(node.expander) + "&__EVENTVALIDATION=%2FwEWFgKj1Y3OAwKOpt5VAqHnn%2BMKAqHnx9UJArXn23ACuOfLkQ4Ct%2BffvAUCoeePqwgC08CX8gsCpp6TtQICwuuDwgQCw%2Bmvng0CjeSX%2BwYCgJKOkQECoYfZ5QwC0dDh3Q8CkvLktQ0C18Dvhg0CrK7GygoCiPzkpAsCzf3AlwMC5aDLgw9yyRWvzmnarI9BlirLg5Vr3AuFYQ%3D%3D",
				"method": "POST",
				"mode": "no-cors"
			})
			.then(response => response.text())
			.then(html => {
				// console.log(`got ${html}`);

				const { document } = (new JSDOM(`<!DOCTYPE html>${html}</html>`)).window;
				let links = document.querySelectorAll('a.treestyle[href]');
				links = Array.prototype.concat.apply([], links);
				const results = [];

				return new Promise((resolve, reject) => {
					async.eachLimit(links, 2,
						(a, next) => {
							let name = a.innerHTML
							const id = a.href.replace(/^.*javascript:TreeItemSelected\('(.*)'\).*$/, '$1');

							// clean name
							const re = new RegExp(`[\\(]*${id}[\\)]*`, 'g')
							name = name.replace(re, '').trim()

							const path = node.path.concat(name)
							const expanderLink = a.parentNode.parentNode.querySelector('a[href*=PopulateNode]');
							let expander = expanderLink ? expanderLink.href.match(/'(ICF\\[^']*)'/) : null;
							expander = expander ? decodeURIComponent(expander[1]).replace(/\\\\/g, '\\') : null;
							expander = expander ? `2|13|fftf|25|s  STRUCTURES ANATOMIQUES0|${expander}` : null;
		
							const child = {id, name, path, expander};
							results.push(child);
		
							if (! expander) {
								fetchNodeContent(child).then(content => {
									child.content = content;
									next()
								})
							} else {
								next()
							}
						},
						_ => {
							console.log('fetched %o', node.name)
							resolve(results);
						})
				});
			})
			.catch(error => {
				console.error(error)
				return { children: [] };
			});
	}

	function fetchNodeContent(node) {
		return fetch(`http://apps.who.int/classifications/icfbrowser/Browse.aspx?code=${node.id}`)
			.then(response => response.text())
			.then(html => {
				const { document } = (new JSDOM(`<!DOCTYPE html>${html}</html>`)).window;
				const title = document.getElementById('Title');
				const description = document.getElementById('Description');
				const inclusions = document.getElementById('Inclusions');
				const exclusions = document.getElementById('Exclusions');
				return {
					title: title ? title.innerHTML : '',
					description: description ? description.innerHTML : '',
					inclusions: inclusions ? inclusions.innerHTML : '',
					exclusions: exclusions ? exclusions.innerHTML : '',
				}
			})
	}

	function search(term) {
		const re = new RegExp(term, 'i');
		return rawData().filter(node => {
			return node.id.match(re)
					|| node.name.match(re)
					|| (node.content && node.content.title.match(re))
					|| (node.content && node.content.description.match(re))
		})
	}

	return {
		loadICF,
		rawData,
		setLanguage,
		search
	};
})();



