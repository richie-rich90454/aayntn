"use strict";

/*
 * aayntn: the general-purpose Node.js contest template.
 *
 * JavaScript is an educational reference only. The published USACO contest
 * instructions list C, C++, Java and Python as the languages to which a
 * solution may be submitted, and JavaScript is not among them. This file
 * exists so that the same algorithm can be read in a scripting runtime.
 *
 * The whole standard input is read at once, because the synchronous
 * alternative would be much slower for a large input.
 */

const fs = require("fs");

const input = fs.readFileSync(0, "utf8").trim();
const tokens = input.length ? input.split(/\s+/) : [];

// The algorithm goes here.

const n = tokens.length ? Number(tokens[0]) : 0;

process.stdout.write(String(n) + "\n");
