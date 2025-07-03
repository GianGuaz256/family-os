# TODO PER VERSIONE 0.0.1

- [x] Aggiungere Daisy UI
- [x] Aggiungere Mobile friendly
- [x] Creare degli user admin per creare le famiglie e per invitare i membri. L'admin può condividere un codice come invito ai membri
- [x] Negli events aggiungere anche le subscription di famiglia
- [x] Aggiungere somma delle subscription totali e per categoria
- [x] Creare tabella subscriptions separata per gestire meglio i dati
- [x] Aggiungere dashboard dedicato per subscriptions con analytics
- [x] Fixare la barra di navigazione nella home page e dargi un senso
- [x] Aggiungere app Settings
- [x] Capire come gestire la pagina di family management (con Admin o da eliminare?)
- [x] Preparare docker per il deploy
- [x] Nella app events aggiungere la logica per selezionare la data nel calendario e vedere gli eventi di quella data e anche crearne in quella data direttamente

# TODO PER VERSIONE 0.STANOTTE

- [x] Creare cursor rules
- [x] Fix degli eventi
- [x] Fixare la logica del recurring event creation senza la data di fine ripetizione (stop repeating) obbligatorio
- [x] Merge della PR su master
- [x] Documents da salvare direttamente su Supabase (pdf, doc, etc)
- [x] Fixare lo scanner del codice a barre locale e se non funziona l'invio all'AI che ne deve estrarre tutte le informazioni
- [x] Divisione degli events dalle recurrive expenses per fare un tracker con mini dashboard per i costi etc

# TODO PER VERSIONE 0.0.1

- [x] Salvare documenta su DB
- [x] Pull to refresh (FIXED - now only on main dashboard with proper fixed layout)
- [x] Rendere visibile gli eventi con fine nel calendario
- [x] Mini ricerca su dynamic safe area
- [x] Aggiungere notes (?)
- [x] Applicazione notes + Ping
- [x] Fixed critical dependency
- [x] Aggiungere immagine profilo (COMPLETED - Profile image functionality added to settings) 

# TODO PER VERSIONE 0.0.2

## Cudi

- [] Gestione migliore del banner delle notifiche sulle App (esempio: numero di eventi della settimana, lista di eventi, etc)
- [] Fixare la logica di visualizzazione dei nomi
- [] Mostrare icona delle user di fianco alla creazione di un documento, evento o task
- [] Mettere la priorità sulla task (flag: high, medium, low con colori diversi) e ordina le task all'interno della lista con la priorità
- [] Cosa succede quando si completa una task? Impostare un bottone dove inserire la logica di completamento (eliminato dopo una settimana, etc)
- [] Fixare visualizzazione del componente di menu per settings dell'utente
- [] Unificare la logica del bottone "+" nella pagina di gestione delle famiglie. Quando cliccato si apre modale per o aggiungersi ad una famiglia o creare una nuova famiglia
- [] Inserire BottomActions anche all'interno della pagina di gestione della famiglia
- [] Fixare la visualizzazione del giorno quando se ne seleziona uno direttamente dal calendario. Nella lista degli eventi fixare la visualizzazione del giorno e soprattutto del mese. Sempre nella lista aggiungere per ogni mese un titolo divisorio tra i vari eventi per renderlo più leggibile. Fixare la visualizzazione dei past events (con un limite da definire). Il bottone di delete degli eventi dalla lista è visualizzabile solo all'interno di un evento. Fixare la visualizzazione dell'evento quando si è in dark mode.

## Gian

- [] Fixare l'icona dell'App (logo)
- [] Ridurre il padding all'interno dell'header delle pagine delle app
- [] Salvare dati offline di Cards e Lists (zustand or other options)
- [] Lasciare banner selezione famiglia on top a tutto la Dashboard e sotto inseriamo la nota "ping"
- [] Fixare visualizzazione MD all'interno delle note (più piccolo e leggibile da mobile)
- [] Fixare il colore del MD Editor quando è in modalità dark, il edit non solo se lo user è admin (TDB)
- [] Nella gestione della famiglia fixare UI per condivisione link (un solo bottone)
- [] Utilizzare stesso componente per la selezione della icona sia su family che su settings
- [] Controllare i vari tag all'interno di tutta l'app
- [] Aggiungere un bottone sul detail delle card per visualizzazione la carta in fullscreen mode

# TODO PER VERSIONE LONG TERM

- [] App per host di AirBnb (esempio) per condividere informazioni importanti sulla casa (doc, guide, codici etc) ai guest
- [] Refactor con routing system (LENTO?)
- [] Gestione connessione degli elementi creati con chi li crea e poi inserire logica per visualizzazione stile notifica (esempio: se un evento è creato da un membro della famiglia, la notifica sarà visualizzata con il nome del membro agli altri membri della famiglia)
- [] Strutturare un sistema di notifiche da inviare via mail o sms con recap settimanale etc con TODO
- [] Creazione di utenti temporanei con solo username e accesso da link
- [] Nelle settings della family gestire i member roles e permissions
- [] Gestire chi crea la task e di chi la completa (flag: created by, completed by)
- [] Impostare lazy loading per velocizzare l'app in caricamento
- [] Creare componente per visualizzazione dei documenti (pdf, doc, jpg, etc)
- [] Gestione del brand e dei loghi per le carte
- [] Gestione del loading nella creazione/eliminazione di elementi (eventi, task, etc)
- [] Fixare il funzionamento della camera quando si scannerizza una carta
