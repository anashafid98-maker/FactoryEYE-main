from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import datetime
import ipaddress
 
APP_URI = "urn:FactoryEYE:OPCUA:PythonClient"
DNS_NAME = "D-CZC929DNPY"          # your PC name (optional)
IP_ADDR = "10.190.50.153"          # your PC/server IP that runs Python (optional)
 
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
 
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "FR"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "FactoryEYE"),
    x509.NameAttribute(NameOID.COMMON_NAME, "FactoryEYE-OPCUA-Python"),
])
 
now = datetime.datetime.now(datetime.timezone.utc)
 
san_list = [x509.UniformResourceIdentifier(APP_URI)]
 
# Add DNS/IP SAN if you want maximum compatibility
if DNS_NAME:
    san_list.append(x509.DNSName(DNS_NAME))
if IP_ADDR:
    san_list.append(x509.IPAddress(ipaddress.ip_address(IP_ADDR)))
 
cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(now - datetime.timedelta(days=1))
    .not_valid_after(now + datetime.timedelta(days=3650))
    .add_extension(x509.SubjectAlternativeName(san_list), critical=False)
    .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
    .sign(key, hashes.SHA256())
)
 
with open("client_key.pem", "wb") as f:
    f.write(key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ))
 
with open("client_cert.pem", "wb") as f:
    f.write(cert.public_bytes(serialization.Encoding.PEM))
 
print("Generated client_cert.pem and client_key.pem")
print("Application URI:", APP_URI)