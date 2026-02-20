{
  description = "Node.js static server for front_end directory";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        nodejs = pkgs.nodejs_22;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [ nodejs ];
        };

        packages.default = pkgs.stdenv.mkDerivation {
          name = "frontend-server";
          src = ./.;

          buildInputs = [ nodejs ];

          installPhase = ''
            mkdir -p $out
            cp server.js $out/
            cp -r front_end $out/
          '';
        };

        apps.default = {
          type = "app";
          program = "${nodejs}/bin/node ${self.packages.${system}.default}/server.js";
        };
      }
    );
}