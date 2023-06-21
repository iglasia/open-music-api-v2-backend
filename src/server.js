require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const ClientError = require("./exceptions/ClientError");

// albums - submission 1
const albums_subm_v1 = require("./api/albums_subm_v1");
const AlbumsService_subm_v1 = require("./services/postgres/AlbumsService_subm_v1");
const AlbumsValidator_subm_v1 = require("./validator/albums_subm_v1");

// songs - submission 1
const songs_subm_v1 = require("./api/songs_subm_v1");
const SongsService_subm_v1 = require("./services/postgres/SongsService_subm_v1");
const SongsValidator_subm_v1 = require("./validator/songs_subm_v1");

// users - submission 2
const users_subm_v2 = require("./api/users_subm_v2");
const UsersService_subm_v2 = require("./services/postgres/UsersService_subm_v2");
const UsersValidator_subm_v2 = require("./validator/users_subm_v2");

// authentications - submission 2
const authentications_subm_v2 = require("./api/authentications_subm_v2");
const AuthenticationsService_subm_v2 = require("./services/postgres/AuthenticationsService_subm_v2");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator_subm_v2 = require("./validator/authentications_subm_v2");

// Playlist - submission 2
const playlists_subm_v2 = require("./api/playlists_subm_v2");
const PlaylistsService_subm_v2 = require("./services/postgres/PlaylistsService_subm_v2");
const PlaylistsValidator_subm_v2 = require("./validator/playlists_subm_v2");

// Collaborations - submission 2
const Collaborations_subm_v2 = require("./api/collaborations_subm_v2");
const CollaborationsService_subm_v2 = require("./services/postgres/CollaborationsServices_subm_v2");
const CollaborationsValidator_subm_v2 = require("./validator/collaborations_subm_v2");

const init = async () => {
  const collaborationsService_subm_v2 = new CollaborationsService_subm_v2();
  const albumsService_subm_v1 = new AlbumsService_subm_v1();
  const playlistsService_subm_v2 = new PlaylistsService_subm_v2(
    collaborationsService_subm_v2
  );
  const authenticationsService_subm_v2 = new AuthenticationsService_subm_v2();
  const usersService_subm_v2 = new UsersService_subm_v2();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  // Error handling
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: "fail",
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }
    if (response instanceof Error) {
      const { statusCode, payload } = response.output;
      if (statusCode === 401) {
        return h.response(payload).code(401);
      }
      const newResponse = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      console.log(response);
      newResponse.code(500);
      return newResponse;
    }
    return response.continue || response;
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy("music_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: songs_subm_v1,
      options: {
        service: new SongsService_subm_v1(),
        validator: SongsValidator_subm_v1,
      },
    },
    {
      plugin: albums_subm_v1,
      options: {
        service: albumsService_subm_v1,
        validator: AlbumsValidator_subm_v1,
      },
    },
    {
      plugin: users_subm_v2,
      options: {
        service: usersService_subm_v2,
        validator: UsersValidator_subm_v2,
      },
    },
    {
      plugin: authentications_subm_v2,
      options: {
        authenticationsService_subm_v2,
        usersService_subm_v2,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator_subm_v2,
      },
    },
    {
      plugin: playlists_subm_v2,
      options: {
        service: playlistsService_subm_v2,
        validator: PlaylistsValidator_subm_v2,
      },
    },
    {
      plugin: Collaborations_subm_v2,
      options: {
        collaborationsService_subm_v2,
        playlistsService_subm_v2,
        validator: CollaborationsValidator_subm_v2,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
