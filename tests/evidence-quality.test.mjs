import test from 'node:test';
import assert from 'node:assert/strict';
import {retrievePassages,rankPassages,classifyAnnouncement} from '../lib/finn-core.mjs';

test('cash flow question abstains on operating-margin-only evidence',()=>{
 const text='Our operating margin was 21.1%. The company reported quarterly revenue growth of 4.2%.';
 assert.deepEqual(retrievePassages(text,'What is the company operating cash flow performance?'),[]);
 assert.deepEqual(retrievePassages(text,'Tell me about cash conversion this year'),[]);
});
test('cash synonyms retrieve relevant evidence without requiring verbatim question terms',()=>{
 const text='Operating margin was 18.3%. Net cash generated from operating activities increased to 200 crore.';
 const result=rankPassages(text,'How strong is cash conversion?');
 assert.equal(result.length,1);assert.match(result[0].text,/cash generated/);assert.ok(result[0].score>0);
});
test('stopwords alone cannot manufacture evidence',()=>{
 assert.deepEqual(retrievePassages('The company reported strong quarterly financial performance.','What did the company report?'),[]);
});
test('long tables preserve matched evidence in returned span',()=>{
 const text='Financial disclosures '.repeat(150)+'Cash flows from operating activities were 500 crore for the year.';
 const passages=retrievePassages(text,'cash flow');
 assert.ok(passages.length);assert.ok(passages.every(p=>/cash flows/i.test(p)));
});
test('material management changes and arrangement schemes receive high priority',()=>{
 for(const title of ['Appointment of Chief Financial Officer','Chief Financial Officer appointment','Change in Chief Executive Officer','Appointment of Managing Director']){
  assert.deepEqual(classifyAnnouncement(title),{category:'management_change',priority:'high'});
 }
 assert.deepEqual(classifyAnnouncement('Board approves Scheme of Arrangement'),{category:'M&A',priority:'high'});
 assert.equal(classifyAnnouncement('Investor meeting schedule').priority,'low');
});
