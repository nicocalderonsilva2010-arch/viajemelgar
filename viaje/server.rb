require 'webrick'
require 'webrick/https'
require 'openssl'

root = Dir.pwd
cert_path = File.join(root, 'certs', 'cert.pem')
key_path = File.join(root, 'certs', 'key.pem')

unless File.exist?(cert_path) && File.exist?(key_path)
  abort "Falta el certificado SSL. Ejecuta: openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost'"
end

server = WEBrick::HTTPServer.new(
  Port: 8443,
  DocumentRoot: root,
  SSLEnable: true,
  SSLVerifyClient: OpenSSL::SSL::VERIFY_NONE,
  SSLPrivateKey: OpenSSL::PKey.read(File.read(key_path)),
  SSLCertificate: OpenSSL::X509::Certificate.new(File.read(cert_path)),
  AccessLog: [],
  Logger: WEBrick::Log::new(File::NULL),
  StartCallback: proc { puts "Servidor HTTPS activo: https://localhost:8443" }
)

trap('INT') { server.shutdown }
server.start
