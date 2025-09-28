const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

async function signDigestWithPrivateKey({ digestBase64, keyPath, digestAlg = process.env.OPENSSL_DIGEST || 'sha256' }) {
  const privatePem = fs.readFileSync(keyPath, 'utf8');
  const privateKey = forge.pki.privateKeyFromPem(privatePem);
  const md = (digestAlg.toLowerCase() === 'sha256' ? forge.md.sha256 : forge.md.sha1).create();
  const raw = Buffer.from(digestBase64, 'base64');
  md.update(raw.toString('binary'));
  const signatureBytes = privateKey.sign(md);
  return Buffer.from(signatureBytes, 'binary').toString('base64');
}

module.exports = {
  signDigestWithPrivateKey,
  async generateRsaKeyPair({ keyBits = 2048, keyDir = (process.env.OPENSSL_KEY_DIR ? path.resolve(process.env.OPENSSL_KEY_DIR) : path.join(process.cwd(), 'cloudca', 'store', 'keys')), namePrefix = `key_${Date.now()}` }) {
    if (!fs.existsSync(keyDir)) fs.mkdirSync(keyDir, { recursive: true });
    const privPath = path.join(keyDir, `${namePrefix}.pem`);
    const pubPemPath = path.join(keyDir, `${namePrefix}.pub.pem`);
    const pubDerPath = path.join(keyDir, `${namePrefix}.pub.der`);

    // Generate RSA keypair with forge
    const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair({ bits: keyBits, e: 0x10001 });
    const privatePem = forge.pki.privateKeyToPem(privateKey);
    const publicPem = forge.pki.publicKeyToPem(publicKey);
    const publicAsn1 = forge.pki.publicKeyToAsn1(publicKey);
    const publicDer = forge.asn1.toDer(publicAsn1).getBytes();

    fs.writeFileSync(privPath, privatePem, 'utf8');
    fs.writeFileSync(pubPemPath, publicPem, 'utf8');
    fs.writeFileSync(pubDerPath, Buffer.from(publicDer, 'binary'));

    return {
      privateKeyPath: privPath,
      publicKeyPem: publicPem,
      publicKeyDerBase64: Buffer.from(publicDer, 'binary').toString('base64'),
    };
  }
};


