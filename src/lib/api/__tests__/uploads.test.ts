jest.mock('@/stores/auth-store', () => {
  let tokens: any = null;
  return {
    __esModule: true,
    useAuthStore: {
      getState: () => ({
        clearSession: jest.fn(),
        updateTokens: (t: any) => {
          tokens = t;
        },
      }),
    },
    getAccessToken: () => tokens?.accessToken ?? null,
    getRefreshToken: () => tokens?.refreshToken ?? null,
    refreshAccessToken: jest
      .fn()
      .mockResolvedValue({ accessToken: 'new-token' }),
  };
});

describe('uploadsApi', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    process.env.NEXT_PUBLIC_API_VERSION = 'v9';
    (global as any).fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadImage', () => {
    it('throws when image is missing in FormData', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const fd = new FormData();
      await expect(uploadsApi.uploadImage(fd)).rejects.toThrow(
        'IMAGE_REQUIRED'
      );
    });

    it('calls apiUpload with correct endpoint and returns response', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const blob = new Blob(['x'], { type: 'image/png' });
      const fd = new FormData();
      fd.append('image', blob, 'test.png');

      const raw = {
        success: true,
        data: {
          image: {
            externalId: 'ext-1',
            publicId: 'pub-1',
            filename: 'test.png',
            size: 1,
            mimetype: 'image/png',
          },
        },
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const resp = await uploadsApi.uploadImage(fd);
      expect((global.fetch as any).mock.calls[0][0]).toBe(
        'http://localhost:3111/api/v9/uploads/images'
      );
      expect(resp.status).toBe('success');
      expect(resp.data.image.filename).toBe('test.png');
    });

    it('propagates validation errors from apiUpload', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const blob = new Blob(['x'], { type: 'text/plain' });
      const fd = new FormData();
      fd.append('image', blob, 'bad.txt');

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          code: 'VALIDATION_ERROR',
          message: 'Invalid file type',
        }),
      });

      await expect(uploadsApi.uploadImage(fd)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    });

    it('propagates size limit errors from apiUpload', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const blob = new Blob(['x'.repeat(10)], { type: 'image/jpeg' });
      const fd = new FormData();
      fd.append('image', blob, 'large.jpg');

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({
          code: 'PAYLOAD_TOO_LARGE',
          message: 'File too large',
        }),
      });

      await expect(uploadsApi.uploadImage(fd)).rejects.toMatchObject({
        code: 'PAYLOAD_TOO_LARGE',
        status: 413,
      });
    });

    it('propagates auth errors from apiUpload', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const blob = new Blob(['x'], { type: 'image/png' });
      const fd = new FormData();
      fd.append('image', blob, 'test.png');

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { accessToken: 'new-token', refreshToken: 'r' },
            timestamp: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              image: {
                externalId: 'e',
                publicId: 'p',
                filename: 'test.png',
                size: 1,
                mimetype: 'image/png',
              },
            },
            timestamp: new Date().toISOString(),
          }),
        });

      const resp = await uploadsApi.uploadImage(fd);
      expect(resp.status).toBe('success');
    });
  });

  describe('listImages', () => {
    it('builds query string and returns images', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const raw = {
        success: true,
        data: [
          {
            externalId: 'e1',
            publicId: 'p1',
            filename: 'a.png',
            size: 1,
            mimetype: 'image/png',
          },
          {
            externalId: 'e2',
            publicId: 'p2',
            filename: 'b.jpg',
            size: 2,
            mimetype: 'image/jpeg',
          },
        ],
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const query = {
        page: 2,
        limit: 10,
        uploader: 'u1',
        format: 'png',
        mimetype: 'image/png',
      };
      const resp = await uploadsApi.listImages(query);
      expect((global.fetch as any).mock.calls[0][0]).toBe(
        'http://localhost:3111/api/v9/uploads/images?page=2&limit=10&uploader=u1&format=png&mimetype=image%2Fpng'
      );
      expect(resp.status).toBe('success');
    });

    it('calls base endpoint when no query provided', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const raw = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const resp = await uploadsApi.listImages();
      expect((global.fetch as any).mock.calls[0][0]).toBe(
        'http://localhost:3111/api/v9/uploads/images'
      );
      expect(resp.status).toBe('success');
    });
  });

  describe('deleteImage', () => {
    it('encodes externalId and issues DELETE', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const raw = {
        success: true,
        data: { ok: true },
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const id = 'abc/123';
      const resp = await uploadsApi.deleteImage(id);
      const call = (global.fetch as any).mock.calls[0];
      expect(call[0]).toBe(
        'http://localhost:3111/api/v9/uploads/images/abc%2F123'
      );
      expect((call[1] || {}).method).toBe('DELETE');
      expect(resp.status).toBe('success');
    });
  });

  describe('createAttachment', () => {
    it('posts payload and returns attachment', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const payload = {
        imageExternalId: 'e1',
        entityType: 'PROJECT',
        entityId: 'p1',
        role: 'cover',
        order: 1,
      };
      const raw = {
        success: true,
        data: {
          id: 'a1',
          imageExternalId: 'e1',
          entityType: 'PROJECT',
          entityId: 'p1',
          role: 'cover',
          order: 1,
        },
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const resp = await uploadsApi.createAttachment(payload);
      const call = (global.fetch as any).mock.calls[0];
      expect(call[0]).toBe('http://localhost:3111/api/v9/uploads/attachments');
      expect((call[1] || {}).method).toBe('POST');
      expect((call[1] || {}).body).toBe(JSON.stringify(payload));
      expect(resp.status).toBe('success');
    });
  });

  describe('listAttachments', () => {
    it('builds query with entityType and entityId', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const raw = {
        success: true,
        data: [
          {
            id: 'a1',
            imageExternalId: 'e1',
            entityType: 'PROJECT',
            entityId: 'p1',
          },
        ],
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const resp = await uploadsApi.listAttachments('PROJECT', 'p1');
      expect((global.fetch as any).mock.calls[0][0]).toBe(
        'http://localhost:3111/api/v9/uploads/attachments?entityType=PROJECT&entityId=p1'
      );
      expect(resp.status).toBe('success');
    });
  });

  describe('deleteAttachment', () => {
    it('encodes id and issues DELETE', async () => {
      const { uploadsApi } = require('@/lib/api/uploads');
      const raw = {
        success: true,
        data: { ok: true },
        timestamp: new Date().toISOString(),
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => raw,
      });

      const id = 'att/1';
      const resp = await uploadsApi.deleteAttachment(id);
      const call = (global.fetch as any).mock.calls[0];
      expect(call[0]).toBe(
        'http://localhost:3111/api/v9/uploads/attachments/att%2F1'
      );
      expect((call[1] || {}).method).toBe('DELETE');
      expect(resp.status).toBe('success');
    });
  });
});
