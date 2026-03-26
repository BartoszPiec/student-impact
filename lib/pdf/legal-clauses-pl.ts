/**
 * Polish legal text constants for contract templates.
 *
 * UWAGA: Klauzule powinny zostać zweryfikowane przez prawnika
 * przed użyciem w produkcji.
 */

export const PLATFORM_ENTITY = {
  name: "Student Impact sp. z o.o.",
  nip: "0000000000", // TODO: Uzupełnić prawdziwy NIP po rejestracji
  address: "ul. Przykładowa 1",
  city: "00-000 Warszawa",
  krs: "0000000000", // TODO: Uzupełnić po rejestracji
  representedBy: "Zarząd Spółki",
};

// ==========================================
// UMOWA A: Firma ↔ Student Impact
// "Umowa o Świadczenie Usługi"
// ==========================================

export const CONTRACT_A_TITLE = "UMOWA O ŚWIADCZENIE USŁUGI";
export const CONTRACT_A_NUMBER_PREFIX = "SI/U";

export const CONTRACT_A_PREAMBLE = `zawarta za pośrednictwem platformy Student Impact, pomiędzy:`;

export const CONTRACT_A_CLAUSES = {
  subject: `1. PRZEDMIOT UMOWY

1.1. Zleceniodawca zleca, a Wykonawca (Student Impact sp. z o.o.) zobowiązuje się do wykonania usługi polegającej na realizacji zlecenia opisanego poniżej, z wykorzystaniem podwykonawcy — studenta wybranego przez Zleceniodawcę za pośrednictwem platformy Student Impact.

1.2. Student Impact sp. z o.o. występuje jako Wykonawca i pośrednik w realizacji zlecenia, odpowiedzialny za koordynację, kontrolę jakości oraz zarządzanie procesem realizacji.`,

  scope: `2. ZAKRES I HARMONOGRAM

2.1. Szczegółowy zakres prac, podział na etapy (kamienie milowe) oraz wynagrodzenie za każdy etap określone są w Harmonogramie stanowiącym integralną część niniejszej umowy.

2.2. Terminy realizacji poszczególnych etapów mogą być modyfikowane za zgodą obu stron.`,

  payment: (reviewDays: number) => `3. WYNAGRODZENIE I PŁATNOŚĆ

3.1. Łączne wynagrodzenie za wykonanie przedmiotu umowy określone jest w Harmonogramie.

3.2. Wynagrodzenie obejmuje prowizję platformy Student Impact zgodną ze stawką przypisaną do danego rodzaju zlecenia i zaakceptowaną w platformie.

3.3. Zleceniodawca zobowiązuje się do zasilenia depozytu zabezpieczającego (escrow) przed rozpoczęciem realizacji zlecenia. Środki są przechowywane na rachunku escrow do czasu akceptacji poszczególnych etapów.

3.4. Akceptacja etapu następuje poprzez zatwierdzenie przez Zleceniodawcę w systemie platformy lub automatycznie po upływie ${reviewDays} dni roboczych od dnia dostarczenia, w przypadku braku odpowiedzi Zleceniodawcy.`,

  acceptance: (reviewDays: number) => `4. ODBIÓR PRAC

4.1. Po zakończeniu każdego etapu, Zleceniodawca ma ${reviewDays} dni roboczych na weryfikację i akceptację lub zgłoszenie uwag.

4.2. W przypadku braku odpowiedzi w terminie określonym w pkt. 4.1, etap uznaje się za automatycznie zaakceptowany.

4.3. Zleceniodawca ma prawo zgłosić uwagi i zażądać poprawek. W takim przypadku termin odbioru biegnie na nowo po dostarczeniu poprawionej wersji.`,

  ip: `5. PRAWA AUTORSKIE I WŁASNOŚĆ INTELEKTUALNA

5.1. Z chwilą akceptacji i zapłaty wynagrodzenia za dany etap, Student Impact sp. z o.o. przenosi na Zleceniodawcę autorskie prawa majątkowe do utworów powstałych w ramach tego etapu, na następujących polach eksploatacji:
  a) utrwalanie i zwielokrotnianie dowolną techniką,
  b) wprowadzanie do obrotu,
  c) publiczne wyświetlanie i udostępnianie,
  d) rozpowszechnianie w sieci Internet,
  e) modyfikacja i opracowanie.

5.2. Student Impact sp. z o.o. gwarantuje, że posiada pełnię praw autorskich majątkowych nabytych od podwykonawcy (studenta) na mocy odrębnej umowy.`,

  confidentiality: `6. POUFNOŚĆ

6.1. Strony zobowiązują się do zachowania w tajemnicy wszelkich informacji uzyskanych w związku z realizacją niniejszej umowy, które stanowią tajemnicę przedsiębiorstwa drugiej strony.

6.2. Obowiązek poufności obowiązuje przez okres realizacji umowy oraz 2 lata po jej zakończeniu.`,

  liability: `7. ODPOWIEDZIALNOŚĆ

7.1. Student Impact sp. z o.o. odpowiada za prawidłową realizację zlecenia i jakość dostarczonych prac.

7.2. W przypadku niewykonania lub nienależytego wykonania zlecenia, Zleceniodawca może żądać poprawek lub zwrotu środków z depozytu escrow.`,

  final: `8. POSTANOWIENIA KOŃCOWE

8.1. Wszelkie zmiany niniejszej umowy wymagają formy dokumentowej pod rygorem nieważności.

8.2. W sprawach nieuregulowanych niniejszą umową zastosowanie mają przepisy Kodeksu cywilnego.

8.3. Ewentualne spory będą rozstrzygane przez sąd właściwy dla siedziby Student Impact sp. z o.o.

8.4. Umowa zostaje zawarta w formie elektronicznej za pośrednictwem platformy Student Impact. Akceptacja warunków umowy w systemie platformy jest równoznaczna ze złożeniem podpisu.`,
};


// ==========================================
// UMOWA B: Student ↔ Student Impact
// "Umowa o Dzieło z Przeniesieniem Praw Autorskich"
// ==========================================

export const CONTRACT_B_TITLE = "UMOWA O DZIEŁO Z PRZENIESIENIEM PRAW AUTORSKICH";
export const CONTRACT_B_NUMBER_PREFIX = "SI/D";

export const CONTRACT_B_PREAMBLE = `zawarta za pośrednictwem platformy Student Impact, pomiędzy:`;

export const CONTRACT_B_CLAUSES = {
  subject: `1. PRZEDMIOT UMOWY

1.1. Zamawiający (Student Impact sp. z o.o.) zamawia, a Wykonawca (Student) zobowiązuje się do wykonania dzieła opisanego poniżej.

1.2. Dzieło realizowane jest w ramach zlecenia pozyskanego za pośrednictwem platformy Student Impact, na rzecz klienta końcowego.`,

  scope: `2. ZAKRES I HARMONOGRAM

2.1. Szczegółowy zakres dzieła, podział na etapy oraz wynagrodzenie za każdy etap określone są w Harmonogramie stanowiącym integralną część niniejszej umowy.

2.2. Wykonawca zobowiązuje się do realizacji dzieła zgodnie z kryteriami akceptacji określonymi dla każdego etapu.`,

  payment: `3. WYNAGRODZENIE

3.1. Wynagrodzenie za wykonanie dzieła określone jest w Harmonogramie (kwoty netto — po potrąceniu prowizji platformy zgodnej ze stawką przypisaną do danego rodzaju zlecenia).

3.2. Wynagrodzenie za poszczególne etapy wypłacane jest po akceptacji danego etapu przez klienta końcowego lub po automatycznej akceptacji.

3.3. Wypłata następuje przelewem na rachunek bankowy wskazany przez Wykonawcę, w terminie do 14 dni roboczych od akceptacji etapu.`,

  ip: `4. PRZENIESIENIE PRAW AUTORSKICH

4.1. Wykonawca przenosi na Zamawiającego (Student Impact sp. z o.o.) autorskie prawa majątkowe do dzieła powstałego w ramach każdego zaakceptowanego etapu, bez ograniczeń czasowych i terytorialnych, na następujących polach eksploatacji:
  a) utrwalanie i zwielokrotnianie dowolną techniką,
  b) wprowadzanie do obrotu,
  c) publiczne wyświetlanie i udostępnianie,
  d) rozpowszechnianie w sieci Internet,
  e) modyfikacja i opracowanie,
  f) wykorzystanie w celach komercyjnych.

4.2. Przeniesienie praw następuje z chwilą akceptacji i zapłaty wynagrodzenia za dany etap.

4.3. Wykonawca oświadcza, że dzieło stanowi wynik jego samodzielnej twórczości i nie narusza praw osób trzecich.

4.4. Wykonawca zezwala na wykonywanie praw zależnych do dzieła.`,

  confidentiality: `5. POUFNOŚĆ

5.1. Wykonawca zobowiązuje się do zachowania w tajemnicy wszelkich informacji dotyczących zlecenia, klienta końcowego oraz materiałów udostępnionych w ramach realizacji.

5.2. Obowiązek poufności obowiązuje przez okres realizacji umowy oraz 2 lata po jej zakończeniu.

5.3. Wykonawca nie może ujawniać tożsamości klienta końcowego bez pisemnej zgody Zamawiającego.`,

  quality: `6. JAKOŚĆ I POPRAWKI

6.1. Wykonawca zobowiązuje się do realizacji dzieła z należytą starannością, zgodnie z kryteriami akceptacji.

6.2. W przypadku zgłoszenia uwag przez klienta, Wykonawca zobowiązany jest do wprowadzenia poprawek w rozsądnym terminie.

6.3. Brak realizacji poprawek może skutkować wstrzymaniem wypłaty wynagrodzenia za dany etap.`,

  final: `7. POSTANOWIENIA KOŃCOWE

7.1. Wszelkie zmiany niniejszej umowy wymagają formy dokumentowej pod rygorem nieważności.

7.2. W sprawach nieuregulowanych niniejszą umową zastosowanie mają przepisy Kodeksu cywilnego, w szczególności przepisy dotyczące umowy o dzieło (art. 627-646 KC) oraz prawa autorskiego.

7.3. Ewentualne spory będą rozstrzygane przez sąd właściwy dla siedziby Student Impact sp. z o.o.

7.4. Umowa zostaje zawarta w formie elektronicznej za pośrednictwem platformy Student Impact.`,
};
