{ pkgs, ... }:

{
  # See https://developers.google.com/idx/guides/customize-idx-env
  # for more details on customizing your environment.
  channels.nixpkgs = "unstable"; # or "stable"
  packages = [ pkgs.nodejs_20 ];

  # `idx.previews` defines the previews that show up in the IDX sidebar.
  idx.previews = {
    # The following `web` preview is the default, and is optional if you
    # just want a single preview for your primary web service.
    web = {
      # The command to start your web server.
      # The command must not exit.
      command = [ "npm" "run" "dev" ];
      # The port that your server will be listening on.
      port = 9002;
    };
    # The following preview is for the Genkit developer UI.
    genkit = {
      # The command to start the Genkit developer UI.
      command = [ "npm" "run" "genkit:watch" ];
      # The port that the Genkit UI will be listening on.
      port = 4000;
    };
  };
}
