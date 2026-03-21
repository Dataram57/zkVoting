{
  description = "Universal Node.js + npm development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        circomlib = pkgs.fetchFromGitHub {
          owner = "iden3";
          repo = "circomlib";
          rev = "35e54ea21da3e8762557234298dbb553c175ea8d"; # pinned commit
          sha256 = "sha256-TK/u5NY+ZTZRFWO1loMeYKbR5L6WHvpTgSZiiY8F3kE="; # replace with correct Nix hash for this commit
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.circom
            pkgs.nodejs_22
          ];

          shellHook = ''
            mkdir -p .nix-bin

######################################################
            cat > .nix-bin/snarkjs << 'EOF'
#!/usr/bin/env bash
# Forward everything to npx snarkjs
npx snarkjs "$@"
EOF
            chmod +x .nix-bin/snarkjs
######################################################
            export PATH="$PWD/.nix-bin:$PATH"
            export CIRCOMLIB_PATH="${circomlib}"
            if [ ! -L circomlib ]; then
                echo "Linking circomlib → ${circomlib}"
                ln -sfn ${circomlib} circomlib
            fi
######################################################
            echo "Node $(node -v)"
            echo "npm $(npm -v)"
            echo "snarkjs $(which snarkjs)"
            echo "CIRCOMLIB_PATH = $CIRCOMLIB_PATH"
          '';
        };
      }
    );
}