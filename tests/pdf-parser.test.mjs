import test from 'node:test';
import assert from 'node:assert/strict';
import {getDocumentProxy,extractText} from 'unpdf';
// A deliberately synthetic PDF proves the actual parser extracts page text;
// it is not used as company evidence or a successful upstream integration.
function pdfFixture(){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const content='BT /F1 12 Tf 50 700 Td (Synthetic parser test: operating cash flow 123.) Tj ET';objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
 let text='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}
 const xref=Buffer.byteLength(text);text+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return new Uint8Array(Buffer.from(text));
}
test('serverless PDF parser extracts actual page text without native canvas',async()=>{
 const pdf=await getDocumentProxy(pdfFixture(),{isEvalSupported:false,useSystemFonts:false});
 try{const result=await extractText(pdf,{mergePages:false});assert.equal(result.totalPages,1);assert.ok(Array.isArray(result.text));assert.match(result.text[0],/operating cash flow 123/)}finally{await pdf.destroy()}
});
