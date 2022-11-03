{
  description = "esmBot";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem
    (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs-18_x;
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.pnpm
            nodePackages.node-gyp
            sqlite
            python3
            gnumake
            cmake
            imagemagick
            vips
            pkg-config
          ] ++ lib.optionals stdenv.isDarwin [
            xcbuild
          ];
        };
      }
    );
}
