import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  let store: Record<string, string>;
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;
  let removeItemSpy: jest.SpyInstance;

  // Keys wie im Service
  const ACCESS_KEY = 'accessToken';
  const REFRESH_KEY = 'refreshToken';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenService],
    });

    service = TestBed.inject(TokenService);

    store = {};

    const lsProto = Object.getPrototypeOf(window.localStorage);

    getItemSpy = jest
      .spyOn(lsProto, 'getItem')
      .mockImplementation((key: any) => {
        return Object.prototype.hasOwnProperty.call(store, key)
          ? store[key]
          : null;
      });

    setItemSpy = jest
      .spyOn(lsProto, 'setItem')
      .mockImplementation((key: any, value: any) => {
        store[key] = value;
      });

    removeItemSpy = jest
      .spyOn(lsProto, 'removeItem')
      .mockImplementation((key: any) => {
        delete store[key];
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAccessToken should read from localStorage using ACCESS_KEY', () => {
    store[ACCESS_KEY] = 'access-123';

    const token = service.getAccessToken();

    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(getItemSpy).toHaveBeenCalledWith(ACCESS_KEY);
    expect(token).toBe('access-123');
  });

  it('getAccessToken should return null when no token is stored', () => {
    const token = service.getAccessToken();

    expect(getItemSpy).toHaveBeenCalledWith(ACCESS_KEY);
    expect(token).toBeNull();
  });

  it('getRefreshToken should read from localStorage using REFRESH_KEY', () => {
    store[REFRESH_KEY] = 'refresh-456';

    const token = service.getRefreshToken();

    expect(getItemSpy).toHaveBeenCalledWith(REFRESH_KEY);
    expect(token).toBe('refresh-456');
  });

  it('getRefreshToken should return null when no token is stored', () => {
    const token = service.getRefreshToken();

    expect(getItemSpy).toHaveBeenCalledWith(REFRESH_KEY);
    expect(token).toBeNull();
  });

  it('storeTokens should write both access and refresh tokens to localStorage', () => {
    service.storeTokens('access-abc', 'refresh-def');

    expect(setItemSpy).toHaveBeenCalledTimes(2);
    expect(setItemSpy).toHaveBeenNthCalledWith(1, ACCESS_KEY, 'access-abc');
    expect(setItemSpy).toHaveBeenNthCalledWith(2, REFRESH_KEY, 'refresh-def');

    expect(store[ACCESS_KEY]).toBe('access-abc');
    expect(store[REFRESH_KEY]).toBe('refresh-def');
  });

  it('clear should remove both access and refresh tokens from localStorage', () => {
    store[ACCESS_KEY] = 'access-x';
    store[REFRESH_KEY] = 'refresh-y';

    service.clear();

    expect(removeItemSpy).toHaveBeenCalledTimes(2);
    expect(removeItemSpy).toHaveBeenNthCalledWith(1, ACCESS_KEY);
    expect(removeItemSpy).toHaveBeenNthCalledWith(2, REFRESH_KEY);

    expect(store[ACCESS_KEY]).toBeUndefined();
    expect(store[REFRESH_KEY]).toBeUndefined();
  });

  it('hasTokens should return true when both access and refresh tokens are present', () => {
    store[ACCESS_KEY] = 'access-x';
    store[REFRESH_KEY] = 'refresh-y';

    const result = service.hasTokens();

    // getAccessToken + getRefreshToken je 1x
    expect(getItemSpy).toHaveBeenCalledWith(ACCESS_KEY);
    expect(getItemSpy).toHaveBeenCalledWith(REFRESH_KEY);
    expect(result).toBe(true);
  });

  it('hasTokens should return false when access token is missing', () => {
    store[REFRESH_KEY] = 'refresh-only';

    const result = service.hasTokens();

    expect(result).toBe(false);
  });

  it('hasTokens should return false when refresh token is missing', () => {
    store[ACCESS_KEY] = 'access-only';

    const result = service.hasTokens();

    expect(result).toBe(false);
  });

  it('hasTokens should return false when both tokens are missing', () => {
    const result = service.hasTokens();

    expect(result).toBe(false);
  });
});
