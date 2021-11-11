import { Utils } from 'jslib-common/misc/utils';

describe('Utils Service', () => {
    describe('getDomain', () => {
        it('should fail for invalid urls', () => {
            expect(Utils.getDomain(null)).toBeNull();
            expect(Utils.getDomain(undefined)).toBeNull();
            expect(Utils.getDomain(' ')).toBeNull();
            expect(Utils.getDomain('https://bit!:"_&ward.com')).toBeNull();
            expect(Utils.getDomain('bitwarden')).toBeNull();
        });

        it('should fail for data urls', () => {
            expect(Utils.getDomain('data:image/jpeg;base64,AAA')).toBeNull();
        });

        it('should handle urls without protocol', () => {
            expect(Utils.getDomain('bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('wrong://bitwarden.com')).toBe('bitwarden.com');
        });

        it('should handle valid urls', () => {
            expect(Utils.getDomain('bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('http://bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('https://bitwarden.com')).toBe('bitwarden.com');

            expect(Utils.getDomain('www.bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('http://www.bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('https://www.bitwarden.com')).toBe('bitwarden.com');

            expect(Utils.getDomain('vault.bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('http://vault.bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('https://vault.bitwarden.com')).toBe('bitwarden.com');

            expect(Utils.getDomain('www.vault.bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('http://www.vault.bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getDomain('https://www.vault.bitwarden.com')).toBe('bitwarden.com');

            expect(Utils.getDomain('user:password@bitwarden.com:8080/password/sites?and&query#hash'))
                .toBe('bitwarden.com');
            expect(Utils.getDomain('http://user:password@bitwarden.com:8080/password/sites?and&query#hash'))
                .toBe('bitwarden.com');
            expect(Utils.getDomain('https://user:password@bitwarden.com:8080/password/sites?and&query#hash'))
                .toBe('bitwarden.com');

            expect(Utils.getDomain('bitwarden.unknown')).toBe('bitwarden.unknown');
            expect(Utils.getDomain('http://bitwarden.unknown')).toBe('bitwarden.unknown');
            expect(Utils.getDomain('https://bitwarden.unknown')).toBe('bitwarden.unknown');
        });

        it('should handle valid urls with an underscore in subdomain', () => {
            expect(Utils.getDomain('my_vault.bitwarden.com/')).toBe('bitwarden.com');
            expect(Utils.getDomain('http://my_vault.bitwarden.com/')).toBe('bitwarden.com');
            expect(Utils.getDomain('https://my_vault.bitwarden.com/')).toBe('bitwarden.com');
        });

        it('should support localhost', () => {
            expect(Utils.getDomain('localhost')).toBe('localhost');
            expect(Utils.getDomain('http://localhost')).toBe('localhost');
            expect(Utils.getDomain('https://localhost')).toBe('localhost');

        });

        it('should support IPv4', () => {
            expect(Utils.getDomain('192.168.1.1')).toBe('192.168.1.1');
            expect(Utils.getDomain('http://192.168.1.1')).toBe('192.168.1.1');
            expect(Utils.getDomain('https://192.168.1.1')).toBe('192.168.1.1');
        });

        it('should support IPv6', () => {
            expect(Utils.getDomain('[2620:fe::fe]')).toBe('2620:fe::fe');
            expect(Utils.getDomain('http://[2620:fe::fe]')).toBe('2620:fe::fe');
            expect(Utils.getDomain('https://[2620:fe::fe]')).toBe('2620:fe::fe');
        });

        it('should reject invalid hostnames', () => {
            expect(Utils.getDomain('https://mywebsite.com$.mywebsite.com')).toBeNull();
            expect(Utils.getDomain('https://mywebsite.com!.mywebsite.com')).toBeNull();
        });
    });

    describe('getHostname', () => {
        it('should fail for invalid urls', () => {
            expect(Utils.getHostname(null)).toBeNull();
            expect(Utils.getHostname(undefined)).toBeNull();
            expect(Utils.getHostname(' ')).toBeNull();
            expect(Utils.getHostname('https://bit!:"_&ward.com')).toBeNull();
            expect(Utils.getHostname('bitwarden')).toBeNull();
        });

        it('should handle valid urls', () => {
            expect(Utils.getHostname('bitwarden')).toBe('bitwarden');
            expect(Utils.getHostname('http://bitwarden')).toBe('bitwarden');
            expect(Utils.getHostname('https://bitwarden')).toBe('bitwarden');

            expect(Utils.getHostname('bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getHostname('http://bitwarden.com')).toBe('bitwarden.com');
            expect(Utils.getHostname('https://bitwarden.com')).toBe('bitwarden.com');

            expect(Utils.getHostname('www.bitwarden.com')).toBe('www.bitwarden.com');
            expect(Utils.getHostname('http://www.bitwarden.com')).toBe('www.bitwarden.com');
            expect(Utils.getHostname('https://www.bitwarden.com')).toBe('www.bitwarden.com');

            expect(Utils.getHostname('vault.bitwarden.com')).toBe('vault.bitwarden.com');
            expect(Utils.getHostname('http://vault.bitwarden.com')).toBe('vault.bitwarden.com');
            expect(Utils.getHostname('https://vault.bitwarden.com')).toBe('vault.bitwarden.com');

            expect(Utils.getHostname('www.vault.bitwarden.com')).toBe('www.vault.bitwarden.com');
            expect(Utils.getHostname('http://www.vault.bitwarden.com')).toBe('www.vault.bitwarden.com');
            expect(Utils.getHostname('https://www.vault.bitwarden.com')).toBe('www.vault.bitwarden.com');

            expect(Utils.getHostname('user:password@bitwarden.com:8080/password/sites?and&query#hash'))
                .toBe('bitwarden.com');
            expect(Utils.getHostname('https://user:password@bitwarden.com:8080/password/sites?and&query#hash'))
                .toBe('bitwarden.com');
            expect(Utils.getHostname('https://bitwarden.unknown')).toBe('bitwarden.unknown');
        });

        it('should handle valid urls with an underscore in subdomain', () => {
            expect(Utils.getHostname('my_vault.bitwarden.com/')).toBe('my_vault.bitwarden.com');
            expect(Utils.getHostname('http://my_vault.bitwarden.com/')).toBe('my_vault.bitwarden.com');
            expect(Utils.getHostname('https://my_vault.bitwarden.com/')).toBe('my_vault.bitwarden.com');
        });

        it('should support localhost', () => {
            expect(Utils.getHostname('localhost')).toBe('localhost');
            expect(Utils.getHostname('http://localhost')).toBe('localhost');
            expect(Utils.getHostname('https://localhost')).toBe('localhost');
        });

        it('should support IPv4', () => {
            expect(Utils.getHostname('192.168.1.1')).toBe('192.168.1.1');
            expect(Utils.getHostname('http://192.168.1.1')).toBe('192.168.1.1');
            expect(Utils.getHostname('https://192.168.1.1')).toBe('192.168.1.1');
        });

        it('should support IPv6', () => {
            expect(Utils.getHostname('[2620:fe::fe]')).toBe('2620:fe::fe');
            expect(Utils.getHostname('http://[2620:fe::fe]')).toBe('2620:fe::fe');
            expect(Utils.getHostname('https://[2620:fe::fe]')).toBe('2620:fe::fe');
        });
    });

    describe('newGuid', () => {
        it('should create a valid guid', () => {
            const validGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(Utils.newGuid()).toMatch(validGuid);
        });
    });
});
