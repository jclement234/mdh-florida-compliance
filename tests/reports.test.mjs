import test from 'node:test';
import assert from 'node:assert/strict';
import {renderReportList,renderSavedReport,sourceUrl} from '../src/reports.js';
const report={id:'fixture',status:'ready',created_at:'2026-09-18T12:00:00Z',business_type_id:'detailing',jurisdiction_id:'gainesville',answers:{has_employees:'no'}};
const item={version:2,snapshot:{title:'Saved title',explanation:'Saved explanation',verified_at:'2026-09-17',fee_amount:0,source:{url:'https://example.gov/rule',agency:'Agency'}}};
test('saved reports retain snapshot wording, recorded version, source and zero fee',()=>{
 const html=renderSavedReport(report,[item]);
 for(const value of ['Saved title','Saved explanation','Saved version 2','https://example.gov/rule','Listed fee: $0'])assert.ok(html.includes(value));
});
test('report data and answers are escaped and executable source links rejected',()=>{
 const html=renderSavedReport({...report,answers:{'<script>':'<img src=x onerror=alert(1)>'}},[{...item,snapshot:{title:'<script>alert(1)</script>',source:{url:'javascript:alert(1)'}}}]);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('href="javascript:'));
 assert.equal(sourceUrl('https://user:password@example.gov'),null);
 assert.equal(sourceUrl('http://example.gov'),null);
});
test('incomplete and refunded reports never render supplied snapshot content',()=>{
 for(const status of ['pending','failed','refunded'])assert.ok(!renderSavedReport({...report,status},[item]).includes('Saved title'));
 assert.ok(renderSavedReport(report,[]).includes('no requirement snapshots'));
});
test('legacy missing sources are disclosed rather than replaced with current information',()=>{
 const html=renderSavedReport(report,[{version:1,snapshot:{title:'Legacy',source_id:'dba'}}]);
 assert.ok(html.includes('Source link was not captured'));assert.ok(!html.includes('href='));
});
test('only ready reports have view controls and list labels are escaped',()=>{
 const html=renderReportList([{...report,status:'refunded'},{...report,id:'ready',business_types:{name:'<img>'}}]);
 assert.equal((html.match(/data-report=/g)||[]).length,1);assert.ok(!html.includes('<img>'));
});
