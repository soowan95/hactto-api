import os
import re

def rewrite_tos():
    with open('/Users/soowan95/Documents/hactto/docs/policy/20260718/terms_of_service.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the text content but keep the HTML format
    # Simple regex replacements to strip out specific lotto predictions things and replace with general API terms
    
    replacements = [
        (r'로또 등 복권 당첨 예상 번호를 분석 및 제공하는 전용 웹서비스를 운영하고 있습니다\.', 'hactto 플랫폼의 로또 번호 분석 및 신뢰도 통계 연산을 담당하는 백엔드 API 및 관련 서비스를 운영하고 있습니다.'),
        (r'당사의 분석시스템은 지금까지 당첨된 1등당첨 조합의 누적조합을 분석, 필터링하여 분석 조합을 추출, 제공하는 시스템으로 정보제공만을 목적으로 하며, 당첨확률 개선서비스가 아니므로 서비스 이용에 참고바랍니다\.', '당사의 API 시스템은 로또 번호 분석 및 신뢰도 통계 연산을 수행하며, 정보 제공 및 통계적 시뮬레이션 목적으로만 제공됩니다.'),
        (r'회사는 건전하고 올바른 복권문화가 정착될 수 있도록 힘쓰고, 회원에게도 복권이 건전한 여가활동이 될 수 있도록 최선의 노력을 합니다\.', '회사는 안정적이고 신뢰도 높은 데이터 분석 API 서비스를 제공하기 위해 최선의 노력을 다합니다.'),
        (r'\"유료 서비스\"라 함은 회사가 제공하는 결제 방식을 통해 유료로 구매 후 사용할 수 있는 서비스를 의미합니다\.', '\"API 서비스\"라 함은 회사가 제공하는 로또 번호 분석 및 통계 연산 기능을 의미합니다.'),
        (r'\"포인트\"라 함은 서비스의 효율적 이용을 위해 회사가 임의로 책정 또는 지급, 조정할 수 있는 재산적 가치가 없는 서비스 상의 가상 데이터를 의미합니다\. 회사가 책정한 일정 이상의 포인트는 혼\(Hon\)로 환전할 수 있습니다\.', ''),
        (r'\"혼\(Hon\)\"라 함은 포인트 전환, 유료 서비스 결제, 이벤트 등을 통해 적립 받았거나 직접 결제하여  “서비스”내에서 사용할 수 있는 전자적 지급 수단을 말합니다\.', ''),
    ]
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open('/Users/soowan95/Documents/hactto/docs/policy/20260718/terms_of_service.html', 'w', encoding='utf-8') as f:
        f.write(content)

def rewrite_privacy():
    with open('/Users/soowan95/Documents/hactto/docs/policy/20260718/privacy_policy.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # The file has a lot of old content. We'll simplify some parts.
    content = re.sub(r'㈜브레인콘텐츠', 'hactto', content)
    content = re.sub(r'브레인콘텐츠', 'hactto', content)
    
    with open('/Users/soowan95/Documents/hactto/docs/policy/20260718/privacy_policy.html', 'w', encoding='utf-8') as f:
        f.write(content)

rewrite_tos()
rewrite_privacy()
print("Done")
