"""Run with python -m unittest discover -s tests -p test_ingest_pdf.py."""
import importlib.util,json,tempfile,unittest
from pathlib import Path
from reportlab.pdfgen.canvas import Canvas
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ingest_pdf',ROOT/'scripts/ingest-pdf.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class ImportRegression(unittest.TestCase):
 def test_existing_idless_corpus_migrates_and_reimport_replaces(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);pdf=root/'primary.pdf';out=root/'corpus.json'
   c=Canvas(str(pdf));c.drawString(20,700,'Cash generated from operating activities was 100 crore.');c.showPage();c.drawString(20,700,'Annual report verified second page.');c.save()
   url='https://example.com/annual%20report.pdf'
   legacy={'ticker':'TEST','url':url,'title':'Legacy excerpt','pages':[{'page':1,'text':'Short evidence excerpt.'}]}
   out.write_text(json.dumps({'documents':[legacy,legacy]}))
   first=module.ingest(pdf,'TEST',url,'annual_report',output=out)
   second=module.ingest(pdf,'TEST','https://example.com/annual report.pdf#page=2','annual_report',output=out)
   corpus=json.loads(out.read_text())
   self.assertEqual(first['id'],second['id']);self.assertEqual(len(corpus['documents']),1)
   self.assertEqual(corpus['schemaVersion'],2)
   self.assertEqual(second['coverage'],'full_document');self.assertEqual(second['pageCount'],2)
   self.assertEqual([p['page'] for p in second['pages']],[1,2]);self.assertEqual(first['sha256'],second['sha256'])
   self.assertEqual(module.migrate_corpus(corpus),module.migrate_corpus(module.migrate_corpus(corpus)))
 def test_current_corpus_migration_keeps_sources_and_full_coverage(self):
  original=json.loads((ROOT/'data/corpus.json').read_text(encoding='utf-8'))
  migrated=module.migrate_corpus(original)
  self.assertEqual(len(migrated['documents']),len(original['documents']))
  self.assertTrue(all(len(d['id'])==64 for d in migrated['documents']))
  self.assertEqual(migrated,module.migrate_corpus(migrated))
 def test_rejects_credentials_and_non_https(self):
  for url in ['http://example.com/report.pdf','https://user:password@example.com/report.pdf']:
   with self.assertRaises(ValueError):module.canonical_url(url)

if __name__=='__main__':unittest.main()
