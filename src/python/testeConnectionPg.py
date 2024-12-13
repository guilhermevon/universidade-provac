import psycopg2

try:
    # Conexão com o banco de dados
    conn = psycopg2.connect(     
        user= "admin_provac",
        host= "192.168.0.232",
        database= "provac_producao",
        password= "Provac@2024",
        port= 5432,
    )
    print("Conexão bem-sucedida!")

    try:
        # Criando um cursor e executando a query
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM educ_system.ranking_usuarios ;")  # Query corrigida
            users = cur.fetchall()
            print("Registros disponíveis na tabela educ_users:", users)
    except Exception as e:
        print(f"Erro ao executar query: {e}")

    # Fechando a conexão
    finally:
        conn.close()
        print("Conexão encerrada.")

except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
