const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");

module.exports = (function() {

	const MAX_LIST_ITEMS = Infinity;
	const FETCH_TIMER = 1.5 * 1000;

	let DATA = [];

	const CACHE_FILE = './ICF.json';

	const ICF_ROOT_NODES = [
		{ root: true, name: 'B Fonctions organiques', path: ['B Fonctions organiques'], id: 'b', expander: '1|5|fftf|23|b  FONCTIONS ORGANIQUES0|ICF\\b' },
		{ root: true, name: 'S Structures anatomiques', path: ['S Structures anatomiques'], id: 's', expander: '2|13|fftf|25|s  STRUCTURES ANATOMIQUES0|ICF\\s' },
		{ root: true, name: 'D Activités et participation', path: ['D Activités et participation'], id: 'd', expander: '3|21|fftf|29|d  ACTIVITÉS ET PARTICIPATION0|ICF\\d' },
		{ root: true, name: 'E Facteurs environnementaux', path: ['E Facteurs environnementaux'], id: 'e', expander: '4|30|fftt|28|e  FACTEURS ENVIRONNEMENTAUX0|ICF\\e' }
	];
	
	let LANG = 'ICFFR';
	function setLanguage(lang) {
		LANG = {
			CN: 'ICFCN',  // Chinese
			EN: 'ICFEN2', // English
			FR: 'ICFFR',  // French
			RU: 'ICFRU',  // Russian
			SP: 'ICFSP'   // Spanish
		}[lang.toUpperCase()] || 'ICFEN2';
		return this;
	}

	function rawData() {
		return DATA;
	}

	function loadICF(force) {
		return new Promise((resolve, reject) => {
			fs.exists(CACHE_FILE, exists => {
				if (!force && exists) {
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
			const list = [].concat(ICF_ROOT_NODES);

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
		return fetchRetry(
			"http://apps.who.int/classifications/icfbrowser/Default.aspx", {
				credentials: "include",
				retry: 10,
				headers: {
					"Accept": "*/*",
					"Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
					"Cache-Control": "no-cache",
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
					"pragma": "no-cache",
					"Cookie": "gsScrollPos-1254611423=0; gsScrollPos-1254611386=; ASP.NET_SessionId=zohljc55lovdefrn0bmbwavv; TS011d2310=015dd60f3e29712a7830e45e72f94e02fd94b25d83b1478f4a320fd6db527a78aa8bde9426acea2d2d5a0639ca3c02785e3ba9664d; TS01ac0ef4=015dd60f3e140b40fb61e9dbd9786206f00356a9b9bdf8f9be5d517f90d4d3708af7e771d0eaf266bd801df5aab60e700d09a1cc8d75ff4f491ec534691300add252013ab5; TS01ac0ef4_77=089aecc054ab28003d1fa1d87eb39e4ee6da77559242e9ca8600f639df1e75b8c99202bc6eb29c9d53a1ccb9b2bbad690812f75e5f8240006e41ca6a297e02a9e242d351e1381c85851f2e576f5d4fd8975a7c6f8bb04fc87b83f3007c33a235fda0b58f268bbe3bf93ec17e692730908b352f49d09eb588",
					"Host": "apps.who.int",
					"Origin": "http://apps.who.int",
					"Pragma": "no-cache",
					"Referer": "http://apps.who.int/classifications/icfbrowser/Default.aspx",
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
				},
				"referrer": "http://apps.who.int/classifications/icfbrowser/Default.aspx",
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": "__EVENTTARGET=&__EVENTARGUMENT=&__LASTFOCUS=&ctl00_ContentPlaceHolder1_ClassificationTreeView1_ExpandState=ecccc&ctl00_ContentPlaceHolder1_ClassificationTreeView1_SelectedNode=&ctl00_ContentPlaceHolder1_ClassificationTreeView1_PopulateLog=&__VIEWSTATE=%2FwEPDwUJNzQ0MTA3OTY5D2QWAmYPZBYCAgMPZBYCAgMPEGQPFgZmAgECAgIDAgQCBRYGEAUNSUNGIC0gQ2hpbmVzZQUFSUNGQ05nEAUNSUNGIC0gRW5nbGlzaAUFSUNGRU5nEAUMSUNGIC0gRnJlbmNoBQVJQ0ZGUmcQBQ1JQ0YgLSBSdXNzaWFuBQVJQ0ZSVWcQBQ1JQ0YgLSBTcGFuaXNoBQVJQ0ZTUGcQBRJJQ0YgMjAxNyAtIEVuZ2xpc2gFBklDRkVOMmcWAQICZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAQUxY3RsMDAkQ29udGVudFBsYWNlSG9sZGVyMSRDbGFzc2lmaWNhdGlvblRyZWVWaWV3MdGRg6KZDtIpBWxKP3drItmiRy%2FF&__VIEWSTATEGENERATOR=6B601A37&ctl00$LanguageDropDown=" + LANG + "&__CALLBACKID=ctl00%24ContentPlaceHolder1%24ClassificationTreeView1&__CALLBACKPARAM=" + encodeURIComponent(node.expander) + "&__EVENTVALIDATION=%2FwEWFgKj1Y3OAwKOpt5VAqHnn%2BMKAqHnx9UJArXn23ACuOfLkQ4Ct%2BffvAUCoeePqwgC08CX8gsCpp6TtQICwuuDwgQCw%2Bmvng0CjeSX%2BwYCgJKOkQECoYfZ5QwC0dDh3Q8CkvLktQ0C18Dvhg0CrK7GygoCiPzkpAsCzf3AlwMC5aDLgw9yyRWvzmnarI9BlirLg5Vr3AuFYQ%3D%3D",
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
							name = name[0].toUpperCase() + name.slice(1).toLowerCase();

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
							setTimeout(_ => resolve(results), FETCH_TIMER);
						})
				});
			})
			.catch(error => {
				console.error(error)
				return { children: [] };
			});
	}

	function fetchNodeContent(node) {
		return fetchRetry(`http://apps.who.int/classifications/icfbrowser/Browse.aspx?code=${node.id}`, {
			retry: 10,
			headers: {
				"Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
				"Cookie": "gsScrollPos-1254611423=0; gsScrollPos-1254611386=; ASP.NET_SessionId=zohljc55lovdefrn0bmbwavv; TS011d2310=015dd60f3e29712a7830e45e72f94e02fd94b25d83b1478f4a320fd6db527a78aa8bde9426acea2d2d5a0639ca3c02785e3ba9664d; TS01ac0ef4=015dd60f3e140b40fb61e9dbd9786206f00356a9b9bdf8f9be5d517f90d4d3708af7e771d0eaf266bd801df5aab60e700d09a1cc8d75ff4f491ec534691300add252013ab5; TS01ac0ef4_77=089aecc054ab28003d1fa1d87eb39e4ee6da77559242e9ca8600f639df1e75b8c99202bc6eb29c9d53a1ccb9b2bbad690812f75e5f8240006e41ca6a297e02a9e242d351e1381c85851f2e576f5d4fd8975a7c6f8bb04fc87b83f3007c33a235fda0b58f268bbe3bf93ec17e692730908b352f49d09eb588",
			}
		}).then(response => response.text())
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

	function fetchRetry(url, opts) {
		let retry = opts && opts.retry || 3
		while (retry > 0) {
			try {
				return fetch(url, opts)
			} catch(e) {
				if (opts.callback) {
					opts.callback(retry)
				}
				retry = retry - 1
				if (retry == 0) {
					throw e
				}
			}
		}
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

///////////////////////
///////////////////////
///////////////////////

module.exports
	.setLanguage('FR')
	.loadICF(true)
	.then(_ => console.log('done'));
