import * as request from 'supertest';
import {
  ComponentMockService,
  LoggerConsoleService,
} from '@digita-ai/semcom-core';
import { ComponentControllerService } from '../../component/services/component-controller.service';
import { ComponentTransformerService } from '../../component/services/component-transformer.service';
import { QuadSerializationService } from '../../quad/services/quad-serialization.service';
import { ServerHandlerContentNegotiationService } from './server-handler-content-negotiation.service';
import { ServerKoaService } from './server-koa.service';

const logger = new LoggerConsoleService();

describe('Server', () => {
  let server: ServerKoaService = null;
  const mockListen = jest.fn();

  afterEach(() => {
    mockListen.mockReset();
  });

  it('should be correctly instantiated without options', () => {
    server = new ServerKoaService(logger);

    expect(server).toBeTruthy();
  });

  it('should be correctly instantiated with options', () => {
    server = new ServerKoaService(logger);

    expect(server).toBeTruthy();
  });

  it('should be start on port 3000 by default', () => {
    server = new ServerKoaService(logger);
    server.app.listen = mockListen;

    server.start({ controllers: [], handlers: [] });

    expect(mockListen.mock.calls.length).toBe(1);
    expect(mockListen.mock.calls[0][0]).toBe(3000);
  });

  it('should be start on port specified in options', () => {
    server = new ServerKoaService(logger);
    server.app.listen = mockListen;

    server.start({ port: 666, controllers: [], handlers: [] });

    expect(mockListen.mock.calls.length).toBe(1);
    expect(mockListen.mock.calls[0][0]).toBe(666);
  });

  it('should return 200 on registered routes', async () => {
    server.start({
      controllers: [
        new ComponentControllerService(
          new ComponentMockService(logger, [
            { uri: 'foo/bar', id: 'bar', label: 'test', shape: 'test' },
          ]),
          logger
        ),
      ],
      handlers: [],
    });

    const response = await request(server.app.callback()).get('/component');
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([{ uri: 'foo/bar', id: 'bar', label: 'test', shape: 'test' }]);
  });

  it('should call a handlers canHandle', async () => {
    const handler = new ServerHandlerContentNegotiationService(
      logger,
      'application/ld+json',
      new ComponentTransformerService(logger), 
      new QuadSerializationService(logger)
    );
    handler.canHandle = mockListen;

    server.start({
      controllers: [
        new ComponentControllerService(
          new ComponentMockService(logger, [
            { uri: 'foo/bar', id: 'bar', label: 'test', shape: 'test' },
          ]),
          logger
        ),
      ],
      handlers: [handler],
    });

    await request(server.app.callback()).get('/component');

    expect(mockListen.mock.calls.length).toBe(1);
  });

  it('should call a handlers handle', async () => {
    const handler = new ServerHandlerContentNegotiationService(
      logger,
      'application/ld+json',
      new ComponentTransformerService(logger), 
      new QuadSerializationService(logger)
    );
    handler.handle = mockListen;

    server.start({
      controllers: [
        new ComponentControllerService(
          new ComponentMockService(logger, [
            { uri: 'foo/bar', id: 'bar', label: 'test', shape: 'test' },
          ]),
          logger
        ),
      ],
      handlers: [handler],
    });

    await request(server.app.callback()).get('/component');

    expect(mockListen.mock.calls.length).toBe(1);
  });

  it('should return 404 on unknow routes', async () => {
    server.start({
      controllers: [
        new ComponentControllerService(
          new ComponentMockService(logger, []),
          logger
        ),
      ],
      handlers: [],
    });

    const response = await request(server.app.callback()).get('/foo-bar');
    expect(response.status).toBe(404);
  });
});
