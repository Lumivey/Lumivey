import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { upload, validateTicket } from './lovable-upload-smoke.mjs';

const signedUrl = 'https://storage.googleapis.com/signed-object?X-Goog-SignedHeaders=content-type%3Bhost%3Bx-goog-content-length-range%3Bx-goog-meta-user_id';

test('PUT sends exact bytes, signed metadata headers, and returns file id', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lovable-smoke-'));
  const path = join(dir, 'smoke.png');
  const bytes = Buffer.from([137,80,78,71,13,10,26,10,1,2,3]);
  try {
    await writeFile(path, bytes);
    const ticket = {url:signedUrl,file_id:'ephemeral/test',headers:{'x-goog-content-length-range':'0,262144000','x-goog-meta-user_id':'test'}};
    const mock = async (url, options) => {
      assert.equal(url, ticket.url);
      assert.equal(options.method, 'PUT');
      assert.deepEqual(options.body, bytes);
      assert.equal(options.headers['x-goog-meta-user_id'], 'test');
      assert.equal(options.headers['content-type'], 'image/png');
      return {ok:true,status:200};
    };
    assert.deepEqual(await upload(path,ticket,mock),{uploaded:true,status:200,fileId:'ephemeral/test',bytes:bytes.length});
    await assert.rejects(upload(path,ticket,async()=>({ok:false,status:403})),/HTTP 403/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('rejects invalid destination and incomplete ticket', () => {
  assert.throws(()=>validateTicket({url:'https://attacker.example/image',file_id:'id'}),/Unexpected upload destination/);
  assert.throws(()=>validateTicket({url:signedUrl}),/file_id/);
  assert.throws(()=>validateTicket({url:'https://storage.googleapis.com/image',file_id:'id'}),/signed content-type/);
  assert.throws(()=>validateTicket({url:signedUrl,file_id:'id',headers:{'content-type':'text/plain'}}),/may not override/);
});
