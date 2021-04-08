import { CipherData } from '../models/data';
import { Cipher } from '../models/domain/cipher';
import { CipherRequest } from '../models/request';
import { CipherResponse } from '../models/response';
import { CipherView } from '../models/view/cipherView';

const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener("message", async (event) => {
    ctx.postMessage("Starting work");

    setTimeout(() => {
        for (let i = 3; i++; i < 500) {
            ctx.postMessage({ result: isPrime(i), number: i });
        }
    }, 10000);


    
    // const promises: any[] = [];
    // const decCiphers: CipherView[] = [];

    // const cipherData: CipherData[] = event.data;
    // const ciphers: Cipher[] = cipherData.map(c => new Cipher(c));

    // ciphers.forEach(cipher => {
    //     promises.push(cipher.decrypt().then(c => decCiphers.push(c)));
    // });

    // await Promise.all(promises);

    // const cipherRequest: CipherRequest[] = decCiphers.map(c => new CipherRequest(new c));
});

function isPrime(num: number) {
    for (var i = 2; i < num; i++)
        if (num % i === 0) return false;
    return num > 1;
}
