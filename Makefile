#==============================================================================#
#                                  MAKE CONFIG                                 #
#==============================================================================#

MAKE	= make -C
SHELL	:= bash --rcfile ~/.bashrc
CWD		= $(shell pwd)

# .ONESHELL:              # Run all lines in single shell

# Default test values
IN_PATH		?= $(SRC_PATH)
ARG				?= 

#==============================================================================#
#                                     NAMES                                    #
#==============================================================================#

NAME 			 	= babylonEvents

### Message Vars
_SUCCESS 		= [$(GRN)SUCCESS$(D)]
_INFO 			= [$(BLU)INFO$(D)]
_SEP	 			= ===================================================

# **************************************************************************** #
#                                    PATHS                                     #
# **************************************************************************** #

SRC_PATH		= src
PUBLIC_PATH = public
NODE_PATH		= node_modules
DIST_PATH		= dist

#==============================================================================#
#                                   CMDS                                       #
#==============================================================================#

RM					= rm -rf

#==============================================================================#
#                                  RULES                                       #
#==============================================================================#

##@ Compilation Rules 🏗

all: dev	

deps: setup-vite setup-typescript setup-babylon setup-tailwind

build:					## Build Project
	@if [ ! -d "$(NODE_PATH)" ]; then \
		make deps; \
		echo " $(RED)$(D) [$(GRN)Installing $(BLU)$(NAME)$(GRN) dependencies...$(D)]"; \
		npm install; \
		echo " $(RED)$(D) [$(GRN)Building $(BLU)$(NAME)$(GRN) Project...$(D)]"; \
		npm run build; \
	else \
		echo " $(RED)$(D) [$(GRN)Project already built!$(D)]"; \
	fi

dev: build		## Start Project
	@echo " $(RED)$(D) [$(GRN)Starting $(BLU)$(NAME)$(GRN) dev server...$(D)]"; \
	npm run dev; \

setup-vite:
	@echo "$(YEL)Setting up $(BLU)Vite$(D)"
	npm install --save-dev vite

setup-typescript:
	@echo "$(YEL)Setting up $(BLU)TypeScript$(D)"
	@if command -v tsc >/dev/null 2>&1; then \
		echo "TypeScript is already installed on this system"; \
	else \
		echo "Installing TypeScript globally..."; \
		sudo npm install -g typescript; \
	fi

setup-babylon:
	@echo "$(YEL)Setting up $(BLU)Babylon.js$(D)"
	npm install --save-dev @babylonjs/core @babylonjs/addons @babylonjs/inspector
	@echo "$(YEL)Setting up $(BLU)Raw-loader$(D) & $(BLU)Html-loader$(D) for loading HTML files"
	npm install --save-dev raw-loader html-loader

setup-tailwind:
	@echo "$(YEL)Setting up $(BLU)TailwindCSS$(D)"
	npm install -D tailwindcss @tailwindcss/vite
	@if [[ ! -f "tailwind.config.js" ]]; then \
		echo "$(YEL)Setting up $(BLU)TailwindCSS$(D) config files"; \
		npx tailwindcss init -p; \
	fi

##@ Test Rules 🧪

test_all:						## Run All tests
	@echo "Test!"

##@ Debug Rules 


##@ Clean-up Rules

clean: 				## Remove
	@echo "*** $(YEL)Removing $(MAG)$(NAME)$(D) and deps $(YEL)temp project files$(D)"
	$(RM) package-lock.json

	@if [ -d "$(NODE_PATH)" ] || [ -d "$(DIST_PATH)" ]; then \
		if [ -d "$(NODE_PATH)" ]; then \
			$(RM) $(NODE_PATH); \
			echo "* $(YEL)Removing $(CYA)$(NODE_PATH)$(D) folder & files$(D): $(_SUCCESS)"; \
		fi; \
		if [ -d "$(DIST_PATH)" ]; then \
			$(RM) $(DIST_PATH); \
			echo "* $(YEL)Removing $(CYA)$(DIST_PATH)$(D) folder & files:$(D) $(_SUCCESS)"; \
		fi; \
	else \
		echo " $(RED)$(D) [$(GRN)Nothing to clean!$(D)]"; \
	fi

##@ Help 󰛵

help: 			## Display this help page
	@awk 'BEGIN {FS = ":.*##"; \
			printf "\n=> Usage:\n\tmake $(GRN)<target>$(D)\n"} \
		/^[a-zA-Z_0-9-]+:.*?##/ { \
			printf "\t$(GRN)%-18s$(D) %s\n", $$1, $$2 } \
		/^##@/ { \
			printf "\n=> %s\n", substr($$0, 5) } ' Makefile
## Tweaked from source:
### https://www.padok.fr/en/blog/beautiful-makefile-awk

.PHONY: bonus clean fclean re help

#==============================================================================#
#                                  UTILS                                       #
#==============================================================================#

# Colors
#
# Run the following command to get list of available colors
# bash -c 'for c in {0..255}; do tput setaf $c; tput setaf $c | cat -v; echo =$c; done'

B  		= $(shell tput bold)
BLA		= $(shell tput setaf 0)
RED		= $(shell tput setaf 1)
GRN		= $(shell tput setaf 2)
YEL		= $(shell tput setaf 3)
BLU		= $(shell tput setaf 4)
MAG		= $(shell tput setaf 5)
CYA		= $(shell tput setaf 6)
WHI		= $(shell tput setaf 7)
GRE		= $(shell tput setaf 8)
BRED 	= $(shell tput setaf 9)
BGRN	= $(shell tput setaf 10)
BYEL	= $(shell tput setaf 11)
BBLU	= $(shell tput setaf 12)
BMAG	= $(shell tput setaf 13)
BCYA	= $(shell tput setaf 14)
BWHI	= $(shell tput setaf 15)
D 		= $(shell tput sgr0)
BEL 	= $(shell tput bel)
CLR 	= $(shell tput el 1)



