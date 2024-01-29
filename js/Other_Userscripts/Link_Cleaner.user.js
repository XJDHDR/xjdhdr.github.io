// ==UserScript==
// @name 			Link Cleaner
// @author 			Xavier "XJDHDR" du Hecquet de Rauville
// @description 	Scans all URLs on a webpage for links that contain disclaimers, redirects, and other similar cruft. It will then remove that cruft and allow you to navigate straight to the endpoint the URL is supposed to point to.
// @license 		MPL-2.0; https://mozilla.org/MPL/2.0/
// @homepageURL 	https://xjdhdr.gitlab.io/
// @supportURL 		https://xjdhdr.gitlab.io/
// @contributionURL https://github.com/XJDHDR/xjdhdr.github.io
// @version 		24.01.0
// @updateURL 		https://raw.githubusercontent.com/XJDHDR/xjdhdr.github.io/main/js/Other_Userscripts/Link_Cleaner.user.js
// @grant 			none
// @include 		*
// ==/UserScript==
// noinspection GrazieInspection

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://github.com/XJDHDR/xjdhdr.github.io/blob/main/LICENSE_MPL.txt.
//
// This Source Code Form is "Incompatible With Secondary Licenses", as defined by the Mozilla Public License, v. 2.0.

const LinkCleanTargets = [
	// If a Target applies to every page on the internet, make sure the Domain array has a "*" as the first entry.
	{ domain: ["www.youtube.com"], 		regex: /^https?:\/\/www.youtube.com\/redirect\?/i,
		startLocationRegex: /q=/i, 		startMatchIndex: 0, 	endLocationRegex: /(&|$)/i, 	endMatchIndex: 0, 	isUriDecodingRequired: true },

	{ domain: ["steamcommunity.com"], 	regex: /^https?:\/\/steamcommunity.com\/linkfilter\/\?/i,
		startLocationRegex: /u=/i, 		startMatchIndex: 0, 	endLocationRegex: /(&|$)/i, 	endMatchIndex: 0, 	isUriDecodingRequired: true },

	{ domain: ["*"], 					regex: /^https?:\/\/external-content.duckduckgo.com\/iu\//i,
		startLocationRegex: /u=/i, 		startMatchIndex: 0, 	endLocationRegex: /(&|$)/i, 	endMatchIndex: 0, 	isUriDecodingRequired: true },

	{ domain: ["*"], 					regex: /^https?:\/\/google.com\/imgres\?/i,
		startLocationRegex: /imgurl=/i, startMatchIndex: 0, 	endLocationRegex: /(&|$)/i, 	endMatchIndex: 0, 	isUriDecodingRequired: true },

	{ domain: ["*"], 					regex: /^https?:\/\/disq.us\/url\?/i,
		startLocationRegex: /url=/i, 	startMatchIndex: 0, 	endLocationRegex: /%3A/i, 		endMatchIndex: -1, 	isUriDecodingRequired: true },

];

document.addEventListener("DOMContentLoaded", documentLoadedHandler);


function documentLoadedHandler()
{
	const startTime = Date.now();

	const allBodyElements = document.getElementsByTagName("body");

	for (let i = 0; i < allBodyElements.length; i++)
	{
		addMutationObserverToBodyElement(allBodyElements[i]);
	}

	for (let i = 0; i < allBodyElements.length; i++)
	{
		checkCurrentElementAndChildren(allBodyElements[i]);
	}

	const endTime = Date.now();
	console.log("XJDHDR: Link Cleaner: documentLoadedHandler function finished in " + (endTime - startTime) + "ms.");
}

function addMutationObserverToBodyElement(BodyElement)
{
	const mutationObserverConfig = {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["href"]
	};
	const observer = new MutationObserver(mutationObserverHandler);
	observer.observe(BodyElement, mutationObserverConfig);
}

function mutationObserverHandler(MutationList, Observer)
{
	const startTime = Date.now();

	for (let i = 0; i < MutationList.length; i++)
	{
		checkCurrentMutationRecord(MutationList[i]);
	}

	const endTime = Date.now();
	console.log("XJDHDR: Link Cleaner: mutationObserverHandler finished in " + (endTime - startTime) + "ms.");
}

function checkCurrentMutationRecord(MutationRecord)
{
	switch (MutationRecord.type)
	{
		case "attributes":
			checkCurrentElementNodeName(MutationRecord.target);
			break;

		case "childList":
			checkChildListModificationMutationRecord(MutationRecord);
			break;

		default:
			break;
	}
}

function checkChildListModificationMutationRecord(MutationRecord)
{
	// Check all new nodes and their children. Don't care about removed nodes.
	for (let i = 0; i < MutationRecord.addedNodes.length; i++)
	{
		checkCurrentElementAndChildren(MutationRecord.addedNodes[i]);
	}
}

function checkCurrentElementAndChildren(Element)
{
	checkCurrentElementIsBodyAndAttribute(Element);

	for (let i = 0; i < Element.children?.length; i++)
	{
		checkCurrentElementAndChildren(Element.children[i]);
	}
}

function checkCurrentElementIsBodyAndAttribute(Element)
{
	if ((typeof Element.hasAttribute !== "function") || (!Element.hasAttribute("href")))
	{
		return;
	}

	checkCurrentElementNodeName(Element);
}

function checkCurrentElementNodeName(Element)
{
	switch (Element.nodeName.toLowerCase())
	{
		case "a":
		case "area":
		case "img":
			checkCurrentElementMatchesLinkCleanTargetDatabase(Element);
			break;

		default:
			return;
	}
}

function checkCurrentElementMatchesLinkCleanTargetDatabase(Element)
{
	const elementHrefAttributeValue = Element.getAttribute("href");

	const hostNameLower = window.location.hostname.toLowerCase();
	for (let i = 0; i < LinkCleanTargets.length; i++)
	{
		for (let j = 0; j < LinkCleanTargets[i].domain.length; j++)
		{
			if ((hostNameLower !== LinkCleanTargets[i].domain[j]) && (LinkCleanTargets[i].domain[0] !== "*"))
			{
				continue;
			}

			if (elementHrefAttributeValue.match(LinkCleanTargets[i].regex))
			{
				processAttributeMatch(Element, elementHrefAttributeValue, LinkCleanTargets[i]);
			}
		}
	}
}

function processAttributeMatch(Element, OldHrefContents, LinkCleanTargetData)
{
	const startRegexMatches = getAllRegexMatchesInString(OldHrefContents, LinkCleanTargetData.startLocationRegex);
	if (startRegexMatches === null)
	{
		return;
	}

	let i = LinkCleanTargetData.startMatchIndex;
	const partiallySlicedHref = (i < 0) ?
		OldHrefContents.slice(startRegexMatches[startRegexMatches.length + i][0] + startRegexMatches[startRegexMatches.length + i][1]):	// Must be + because i would be -ve here.
		OldHrefContents.slice(startRegexMatches[i][0] + startRegexMatches[i][1]);

	let fullySlicedHref;
	const endRegexMatches = getAllRegexMatchesInString(partiallySlicedHref, LinkCleanTargetData.endLocationRegex);
	if (endRegexMatches !== null)
	{
		i = LinkCleanTargetData.endMatchIndex;
		fullySlicedHref = (i < 0) ?
			partiallySlicedHref.slice(0, endRegexMatches[endRegexMatches.length + i][0]) :	// Must be + because i would be -ve here.
			partiallySlicedHref.slice(0, endRegexMatches[i][0]);
	}
	else
	{
		fullySlicedHref = partiallySlicedHref;
	}

	const finalHref = (LinkCleanTargetData.isUriDecodingRequired) ?
		decodeURIComponent(fullySlicedHref) :
		fullySlicedHref;

	Element.setAttribute("href", finalHref);

	// Run this element through the match checker again to see if anything else needs to be stripped.
	checkCurrentElementMatchesLinkCleanTargetDatabase(Element)
}

function getAllRegexMatchesInString(String, Regex)
{
	const results = new Array(0);
	let currentString = String;
	let i = 0;

	while (currentString.length !== 0)
	{
		const matchResult = currentString.match(Regex);
		if (matchResult === null)
		{
			if (i === 0)
			{
				return null;
			}

			break;
		}

		const matchResultStartPos = (i !== 0) ?
			results[i - 1][0] + results[i - 1][1] + matchResult.index :
			matchResult.index;
		const matchResultLength = matchResult[0].length;
		results[i] = [matchResultStartPos, matchResultLength];

		i++;
		currentString = currentString.slice(matchResultStartPos + matchResultLength);
	}

	return results;
}
