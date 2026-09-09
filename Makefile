.PHONY: build run cli clean

build:
	cd frontend && npm run build
	CGO_LDFLAGS="-framework UniformTypeIdentifiers" go build -tags desktop,production -o bin/Omnidrop .

cli:
	go build -o bin/omnidrop-cli ./cmd/omnidrop-cli

run: build
	./bin/Omnidrop

clean:
	rm -rf bin/
