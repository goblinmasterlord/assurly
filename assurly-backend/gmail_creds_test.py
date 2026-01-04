import smtplib
import ssl
from email.mime.text import MIMEText

email = 'tom@thetransformative.com'
password = 'eqro opjn pbxr eoja'

try:
    context = ssl.create_default_context()
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls(context=context)
        server.login(email, password)
        print('✅ Gmail credentials work!')
except Exception as e:
    print(f'❌ Gmail test failed: {e}')